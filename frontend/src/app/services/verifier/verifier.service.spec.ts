import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { Subject } from "rxjs";

import { environment } from "../../../environments/environment";
import { Verifier, VerifierOverrides } from "../../types/Verifier";
import { ConsoleService } from "../console/console.service";
import { ConsoleErrorLine, ConsoleInfoLine, ConsoleLogLine, isError, isGroup, isInfo } from "../console/log";
import { ProjectService } from "../project/project.service";
import { VerifierService } from "./verifier.service";

describe("VerifierService", () => {
  const catalogUrl = environment.apiUrl + "/editor/verifiers";

  /** The Functional Verifier exactly as the backend serves it and as the local fallback builds it. */
  const functionalVerifier: Verifier = {
    id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [],
  };

  let service: VerifierService;
  let httpTesting: HttpTestingController;
  let consoleService: ConsoleService;
  let projectServiceStub: Partial<ProjectService>;
  let overridesLoaded: Subject<void>;

  /** A locked-off entry exactly as the backend serves it for an unavailable Verifier. */
  const lockedOff = (id: string): Verifier => ({
    id, label: id + ' (offline)', enabled: false, toggleable: false, settings: [], variables: [],
  });

  /**
   * Answer the Catalog request issued at construction with the given entries — the seam
   * through which every test loads its Catalog, exactly as the backend would deliver it.
   */
  function loadCatalog(verifiers: Verifier[]): void {
    httpTesting.expectOne(catalogUrl).flush({ verifiers });
  }

  beforeEach(() => {
    overridesLoaded = new Subject<void>();
    projectServiceStub = {
      getVerifierOverrides: () => null,
      saveVerifierOverrides: () => undefined,
      verifierOverridesLoaded: overridesLoaded,
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectService, useValue: projectServiceStub },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    consoleService = TestBed.inject(ConsoleService);
    service = TestBed.inject(VerifierService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should be created", () => {
    loadCatalog([]);
    expect(service).toBeTruthy();
  });

  describe("Catalog fetch", () => {
    it("fetches the Catalog once at construction with GET", () => {
      const request = httpTesting.expectOne(catalogUrl);
      expect(request.request.method).toBe("GET");
      request.flush({ verifiers: [] });

      httpTesting.expectNone(catalogUrl);
    });

    it("shows the Functional Verifier until the Catalog arrives", () => {
      expect(service.verifiers().map((verifier) => verifier.id)).toEqual(['func']);
      loadCatalog([]);
    });

    it("shows the fetched Catalog", () => {
      loadCatalog([functionalVerifier]);

      expect(service.verifiers()).toEqual([functionalVerifier]);
    });

    it("applies the existing ranking to the fetched Catalog", () => {
      loadCatalog([
        { id: 'plain', label: 'Nothing', enabled: true, settings: [], variables: [] },
        { id: 'text', label: 'Text', enabled: true, statusPlaceholder: 'pending', settings: [], variables: [] },
        { id: 'settings', label: 'Settings', enabled: true, settings: [
          { id: 's', label: 's', type: 'text' },
        ], variables: [] },
        { id: 'vars', label: 'Variables', enabled: true, settings: [], variables: [
          { id: 'x', type: 'int' },
        ] },
        functionalVerifier,
      ]);

      expect(service.verifiers().map((verifier) => verifier.id)).toEqual([
        'func', 'vars', 'settings', 'text', 'plain',
      ]);
    });

    it("falls back to exactly the Functional Verifier and logs one console line when the fetch fails for good", () => {
      httpTesting.expectOne(catalogUrl).flush("no such route", { status: 404, statusText: "Not Found" });

      expect(service.verifiers()).toEqual([functionalVerifier]);
      expect(service.catalogFetch()).toEqual({ status: 'failed' });
      expect(consoleService.numberOfLogs).toBe(1);
      const line = consoleService.logs[0];
      expect(isGroup(line)).toBeFalse();
      expect(isError(line as ConsoleLogLine)).toBeTrue();
      expect((line as ConsoleErrorLine).action).toContain("Verifier Catalog");
    });

    describe("while the backend is not reachable", () => {
      const delay = VerifierService.CATALOG_FETCH_DELAY_MS;
      const attempts = VerifierService.CATALOG_FETCH_ATTEMPTS;

      /** Fail the pending Catalog request the way a backend that is not listening does. */
      function failUnreachable(): void {
        httpTesting.expectOne(catalogUrl).error(new ProgressEvent("error"));
      }

      it("reports the first attempt as fetching until the Catalog arrives", () => {
        expect(service.catalogFetch()).toEqual({ status: 'fetching', attempt: 1 });
        loadCatalog([]);
        expect(service.catalogFetch()).toEqual({ status: 'loaded' });
      });

      it("retries after the delay on a network error and shows the Catalog once the backend answers", fakeAsync(() => {
        failUnreachable();
        expect(service.verifiers().map((verifier) => verifier.id)).toEqual(['func']);
        expect(consoleService.numberOfLogs).toBe(0);
        expect(service.catalogFetch()).toEqual({ status: 'fetching', attempt: 2 });

        httpTesting.expectNone(catalogUrl);
        tick(delay);
        loadCatalog([functionalVerifier, lockedOff('eebc')]);

        expect(service.verifiers().map((verifier) => verifier.id)).toEqual(['func', 'eebc']);
        expect(service.catalogFetch()).toEqual({ status: 'loaded' });
        expect(consoleService.numberOfLogs).toBe(0);
      }));

      for (const status of [502, 503, 504]) {
        it(`retries on a ${status} from a proxy in front of a backend that is still starting`, fakeAsync(() => {
          httpTesting.expectOne(catalogUrl).flush("starting", { status, statusText: "Unavailable" });
          tick(delay);
          loadCatalog([functionalVerifier]);

          expect(service.verifiers()).toEqual([functionalVerifier]);
          expect(consoleService.numberOfLogs).toBe(0);
        }));
      }

      it("does not retry on an error that is not a connectivity problem", fakeAsync(() => {
        httpTesting.expectOne(catalogUrl).flush("bug", { status: 500, statusText: "Internal Server Error" });
        tick(delay);

        httpTesting.expectNone(catalogUrl);
        expect(service.catalogFetch()).toEqual({ status: 'failed' });
        expect(consoleService.numberOfLogs).toBe(1);
      }));

      it("sends one request at a time, spaced by the delay", fakeAsync(() => {
        failUnreachable();
        tick(delay - 1);
        httpTesting.expectNone(catalogUrl);
        tick(1);
        failUnreachable();
        tick(delay);
        loadCatalog([]);
      }));

      it("gives up after the last attempt with the Functional Verifier and one console line", fakeAsync(() => {
        for (let attempt = 1; attempt < attempts; attempt++) {
          failUnreachable();
          expect(service.catalogFetch()).toEqual({ status: 'fetching', attempt: attempt + 1 });
          tick(delay);
        }
        failUnreachable();
        tick(delay);

        httpTesting.expectNone(catalogUrl);
        expect(service.verifiers()).toEqual([functionalVerifier]);
        expect(service.catalogFetch()).toEqual({ status: 'failed' });
        expect(consoleService.numberOfLogs).toBe(1);
        expect(isError(consoleService.logs[0] as ConsoleLogLine)).toBeTrue();
      }));
    });

    it("does not get stuck \"fetching\" forever when the backend sends a shape-invalid Catalog", () => {
      // A Verifier entry missing the required `settings`/`variables` arrays: well-formed JSON,
      // a 200 status, but not a Catalog the frontend's own contract allows through unchecked.
      httpTesting.expectOne(catalogUrl).flush({
        verifiers: [{ id: 'func', label: 'Functional correctness', enabled: true }],
      });

      expect(service.verifiers()).toEqual([functionalVerifier]);
      expect(service.catalogFetch()).toEqual({ status: 'failed' });
      expect(consoleService.numberOfLogs).toBe(1);
      expect(isError(consoleService.logs[0] as ConsoleLogLine)).toBeTrue();
    });

    it("logs nothing when the Catalog is fetched successfully", () => {
      loadCatalog([]);

      expect(consoleService.numberOfLogs).toBe(0);
    });

    it("forwards the Catalog's message verbatim to the console when present", () => {
      const message = "2 verifiers unavailable: eebc (unreachable), sec (invalid description)";
      httpTesting.expectOne(catalogUrl).flush({
        verifiers: [
          functionalVerifier,
          lockedOff('eebc'),
          lockedOff('sec'),
        ],
        message,
      });

      expect(consoleService.numberOfLogs).toBe(1);
      const line = consoleService.logs[0];
      expect(isGroup(line)).toBeFalse();
      expect(isInfo(line as ConsoleLogLine)).toBeTrue();
      expect((line as ConsoleInfoLine).message).toBe(message);
    });

    it("shows locked-off entries exactly as the backend serves them", () => {
      loadCatalog([
        functionalVerifier,
        lockedOff('eebc'),
      ]);

      const eebc = service.verifiers().find((verifier) => verifier.id === 'eebc')!;
      expect(eebc.label).toBe('eebc (offline)');
      expect(eebc.enabled).toBeFalse();
      expect(eebc.toggleable).toBeFalse();
    });

    it("keeps saved Overrides for a locked-off Verifier without applying them", () => {
      const persisted: VerifierOverrides = { eebc: { enabled: true, settings: { s: 'saved' } } };
      projectServiceStub.getVerifierOverrides = () => persisted;
      const saved = jasmine.createSpy("saveVerifierOverrides");
      projectServiceStub.saveVerifierOverrides = saved;
      overridesLoaded.next();
      loadCatalog([
        functionalVerifier,
        lockedOff('eebc'),
      ]);

      const eebc = service.verifiers().find((verifier) => verifier.id === 'eebc')!;
      expect(eebc.enabled).toBeFalse();
      expect(saved).not.toHaveBeenCalled();

      service.setEnabled('other', true);
      expect(saved).toHaveBeenCalledWith(jasmine.objectContaining({ eebc: persisted['eebc'] }));
    });
  });

  describe("Overrides over the fetched Catalog", () => {
    it("merges Overrides loaded with the project over the fetched Catalog", () => {
      loadCatalog([
        { id: 'v', label: 'V', enabled: true, settings: [
          { id: 's', label: 's', type: 'text', default: 'd' },
        ], variables: [] },
      ]);

      const persisted: VerifierOverrides = { v: { enabled: false, settings: { s: 'saved' } } };
      projectServiceStub.getVerifierOverrides = () => persisted;
      overridesLoaded.next();

      expect(service.verifiers()[0].enabled).toBeFalse();
      expect(service.verifiers()[0].settings[0].input).toBe('saved');
    });

    it("keeps Overrides made before the Catalog arrived", () => {
      service.setEnabled('v', false);
      loadCatalog([
        { id: 'v', label: 'V', enabled: true, settings: [], variables: [] },
      ]);

      expect(service.verifiers()[0].enabled).toBeFalse();
    });
  });

  it("seeds setting inputs from their default on load", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'withDefault', label: 'a', type: 'text', required: true, default: 'd' },
        { id: 'withoutDefault', label: 'b', type: 'text' },
      ], variables: [] },
    ]);

    const settings = service.verifiers()[0].settings;
    expect(settings[0].input).toBe('d');
    expect(settings[1].input).toBe('');
  });

  it("persists a setting input through updateSetting", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 's', label: 's', type: 'text' },
      ], variables: [] },
    ]);

    service.updateSetting('v', 's', 'typed');

    expect(service.verifiers()[0].settings[0].input).toBe('typed');
  });

  describe("settings stamp", () => {
    beforeEach(() => {
      loadCatalog([
        { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
          { id: 's', label: 's', type: 'text' },
        ], variables: [] },
      ]);
    });

    it("stamps the Override with Date.now() on a setting change and persists it with the settings", () => {
      const saved = jasmine.createSpy("saveVerifierOverrides");
      projectServiceStub.saveVerifierOverrides = saved;
      spyOn(Date, "now").and.returnValue(1727000000000);

      service.updateSetting('v', 's', 'typed');

      expect(service.settingsStamp('v')).toBe(1727000000000);
      expect(saved).toHaveBeenCalledWith({ v: { settings: { s: 'typed' }, settingsUpdatedAt: 1727000000000 } });
    });

    it("has no stamp until a setting changes, and the enabled toggle leaves it alone", () => {
      expect(service.settingsStamp('v')).toBeUndefined();
      service.setEnabled('v', false);
      expect(service.settingsStamp('v')).toBeUndefined();

      spyOn(Date, "now").and.returnValue(5);
      service.updateSetting('v', 's', 'typed');
      service.setEnabled('v', true);

      expect(service.settingsStamp('v')).toBe(5);
    });
  });

  describe("settings stamp over Catalog defaults", () => {
    it("leaves the stamp alone when a control reports the value the setting already has, the Catalog default included", () => {
      const saved = jasmine.createSpy("saveVerifierOverrides");
      projectServiceStub.saveVerifierOverrides = saved;
      const changed = jasmine.createSpy("overridesChanged");
      service.overridesChanged.subscribe(changed);
      loadCatalog([
        { id: 'w', label: 'W', enabled: true, settings: [
          { id: 'text', label: 't', type: 'text', default: 'd' },
          { id: 'flag', label: 'f', type: 'boolean', default: true },
        ], variables: [] },
      ]);

      service.updateSetting('w', 'text', 'd');
      service.updateSetting('w', 'flag', true);
      expect(service.settingsStamp('w')).toBeUndefined();

      spyOn(Date, "now").and.returnValue(5);
      service.updateSetting('w', 'text', 'typed');
      (Date.now as jasmine.Spy).and.returnValue(6);
      service.updateSetting('w', 'text', 'typed');

      expect(service.settingsStamp('w')).toBe(5);
      expect(saved).toHaveBeenCalledTimes(1);
      expect(changed).toHaveBeenCalledTimes(1);
    });
  });

  it("reflects setEnabled in the merged verifier list", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [], variables: [] },
    ]);

    service.setEnabled('v', false);

    expect(service.verifiers()[0].enabled).toBeFalse();
  });

  it("ignores empty required settings of disabled verifiers for validity", () => {
    loadCatalog([
      { id: 'on', label: 'On', enabled: true, statusPlaceholder: '', settings: [
        { id: 's', label: 's', type: 'text', required: true, default: 'ok' },
      ], variables: [] },
      { id: 'off', label: 'Off', enabled: false, statusPlaceholder: '', settings: [
        { id: 's', label: 's', type: 'text', required: true, default: '' },
      ], variables: [] },
    ]);

    expect(service.verifiersValid()).toBeTrue();
  });

  it("is invalid when an enabled verifier has an empty required setting", () => {
    loadCatalog([
      { id: 'on', label: 'On', enabled: true, statusPlaceholder: '', settings: [
        { id: 's', label: 's', type: 'text', required: true, default: '' },
      ], variables: [] },
    ]);

    expect(service.verifiersValid()).toBeFalse();
  });

  it("treats a numeric setting within range and on the step grid as valid", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'n', label: 'n', type: 'text', valueType: 'number', step: 0.5, range: { min: 0, max: 10 } },
      ], variables: [] },
    ]);

    service.updateSetting('v', 'n', '2.5');

    expect(service.verifiersValid()).toBeTrue();
  });

  it("is invalid when a numeric setting is out of range", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'n', label: 'n', type: 'text', valueType: 'number', range: { min: 0, max: 10 } },
      ], variables: [] },
    ]);

    service.updateSetting('v', 'n', '20');

    expect(service.verifiersValid()).toBeFalse();
  });

  it("is invalid when a numeric setting violates its step (non-integer with default step 1)", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'n', label: 'n', type: 'text', valueType: 'number' },
      ], variables: [] },
    ]);

    service.updateSetting('v', 'n', '4.2');

    expect(service.verifiersValid()).toBeFalse();
  });

  it("persists a boolean setting input through updateSetting and stays valid", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'flag', label: 'flag', type: 'boolean', default: false },
      ], variables: [] },
    ]);

    service.updateSetting('v', 'flag', true);

    expect(service.verifiers()[0].settings[0].input).toBeTrue();
    expect(service.verifiersValid()).toBeTrue();
  });

  describe("effectiveEnabledNonFunctionalVerifierIds", () => {
    it("is the enabled non-functional list when functionalOnly is false", () => {
      loadCatalog([
        functionalVerifier,
        { id: 'mock', label: 'Mock', enabled: true, settings: [], variables: [] },
        { id: 'off', label: 'Off', enabled: false, settings: [], variables: [] },
      ]);

      expect(service.effectiveEnabledNonFunctionalVerifierIds).toEqual(['mock']);
    });

    it("is empty when functionalOnly is true regardless of what's enabled", () => {
      loadCatalog([
        functionalVerifier,
        { id: 'mock', label: 'Mock', enabled: true, settings: [], variables: [] },
      ]);

      service.setFunctionalOnly(true);

      expect(service.effectiveEnabledNonFunctionalVerifierIds).toEqual([]);
    });

    it("reacts live to flipping functionalOnly back and forth", () => {
      loadCatalog([
        functionalVerifier,
        { id: 'mock', label: 'Mock', enabled: true, settings: [], variables: [] },
      ]);

      service.setFunctionalOnly(true);
      expect(service.effectiveEnabledNonFunctionalVerifierIds).toEqual([]);

      service.setFunctionalOnly(false);
      expect(service.effectiveEnabledNonFunctionalVerifierIds).toEqual(['mock']);
    });
  });

  it("treats an empty optional numeric setting as valid", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'n', label: 'n', type: 'text', valueType: 'number', range: { min: 1, max: 10 } },
      ], variables: [] },
    ]);

    expect(service.verifiersValid()).toBeTrue();
  });

  it("is invalid for every input that violates the strict decimal grammar", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'n', label: 'n', type: 'text', valueType: 'number' },
      ], variables: [] },
    ]);

    for (const input of ['1e3', ' 5', '5 ', '.5', '5.', '0x10', '+5', '  ']) {
      service.updateSetting('v', 'n', input);
      expect(service.verifiersValid()).withContext(input).toBeFalse();
    }
  });

  it("is valid for negative, zero, and decimal inputs that match the strict grammar", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'n', label: 'n', type: 'text', valueType: 'number', step: 0.25, range: { min: -100, max: 100 } },
      ], variables: [] },
    ]);

    for (const input of ['-12', '0', '3.25']) {
      service.updateSetting('v', 'n', input);
      expect(service.verifiersValid()).withContext(input).toBeTrue();
    }
  });

  it("blocks the run gate for a whitespace-only optional numeric setting, unlike an empty one", () => {
    loadCatalog([
      { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
        { id: 'n', label: 'n', type: 'text', valueType: 'number' },
      ], variables: [] },
    ]);

    service.updateSetting('v', 'n', '  ');
    expect(service.verifiersValid()).toBeFalse();

    service.updateSetting('v', 'n', '');
    expect(service.verifiersValid()).toBeTrue();
  });

  describe("a saved value the field can't represent as valid", () => {
    it("blocks the run gate and is listed by invalidVerifierSettings for a wrong-typed text setting", () => {
      const persisted: VerifierOverrides = { v: { settings: { s: 5 as unknown as string } } };
      projectServiceStub.getVerifierOverrides = () => persisted;
      overridesLoaded.next();
      loadCatalog([
        { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
          { id: 's', label: 's', type: 'text', default: 'd' },
        ], variables: [] },
      ]);

      expect(service.verifiersValid()).toBeFalse();
      const invalid = service.invalidVerifierSettings;
      expect(invalid.length).toBe(1);
      expect(invalid[0].settings.map((setting) => setting.id)).toEqual(['s']);
    });

    it("blocks the run gate for an unknown select option", () => {
      loadCatalog([
        { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
          { id: 'sel', label: 'sel', type: 'select', required: true, default: 'a',
            options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
        ], variables: [] },
      ]);

      service.updateSetting('v', 'sel', 'gone');

      expect(service.verifiersValid()).toBeFalse();
    });

    it("blocks the run gate for a wrong-typed boolean setting", () => {
      const persisted: VerifierOverrides = { v: { settings: { flag: 'yes' } } };
      projectServiceStub.getVerifierOverrides = () => persisted;
      overridesLoaded.next();
      loadCatalog([
        { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
          { id: 'flag', label: 'flag', type: 'boolean', default: true },
        ], variables: [] },
      ]);

      expect(service.verifiersValid()).toBeFalse();
      expect(service.verifiers()[0].settings[0].input).toBeUndefined();
    });

    it("clears once the user changes the field to a well-typed value", () => {
      const persisted: VerifierOverrides = { v: { settings: { s: 5 as unknown as string } } };
      projectServiceStub.getVerifierOverrides = () => persisted;
      overridesLoaded.next();
      loadCatalog([
        { id: 'v', label: 'V', enabled: true, statusPlaceholder: '', settings: [
          { id: 's', label: 's', type: 'text', default: 'd' },
        ], variables: [] },
      ]);
      expect(service.verifiersValid()).toBeFalse();

      service.updateSetting('v', 's', 'typed');

      expect(service.verifiersValid()).toBeTrue();
      expect(service.verifiers()[0].settings[0].input).toBe('typed');
    });
  });
});
