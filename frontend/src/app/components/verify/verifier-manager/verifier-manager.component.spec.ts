import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';

import { environment } from '../../../../environments/environment';
import { VerifierService } from '../../../services/verifier/verifier.service';
import { TreeService } from '../../../services/tree/tree.service';
import { ProjectService } from '../../../services/project/project.service';
import { Verifier } from '../../../types/Verifier';
import { IVerifiers } from '../../../types/statements/abstract-statement';
import { RootStatement } from '../../../types/statements/root-statement';
import { Condition } from '../../../types/condition/condition';
import { LocalCBCFormula } from '../../../types/CBCFormula';
import { VerifierManagerComponent } from './verifier-manager.component';

describe('VerifierManagerComponent', () => {
  const catalogUrl = environment.apiUrl + '/editor/verifiers';

  let component: VerifierManagerComponent;
  let fixture: ComponentFixture<VerifierManagerComponent>;
  let httpTesting: HttpTestingController;

  /** The panel's status line about the Catalog fetch, or `null` once it is gone. */
  function statusText(): string | null {
    fixture.detectChanges();
    const element: HTMLElement | null = fixture.nativeElement.querySelector('.catalog-status');
    return element ? element.textContent!.replace(/\s+/g, ' ').trim() : null;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifierManagerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    })
    .compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VerifierManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    httpTesting.expectOne(catalogUrl).flush({ verifiers: [] });
    expect(component).toBeTruthy();
  });

  it('says the Catalog is being fetched until it arrives', () => {
    expect(statusText()).toBe('Fetching Verifier Catalog…');

    httpTesting.expectOne(catalogUrl).flush({ verifiers: [] });

    expect(statusText()).toBeNull();
  });

  it('counts the attempts while the backend is not reachable', fakeAsync(() => {
    httpTesting.expectOne(catalogUrl).error(new ProgressEvent('error'));

    expect(statusText()).toBe(
      `Fetching Verifier Catalog… Backend not reachable yet, attempt 2 of ${VerifierService.CATALOG_FETCH_ATTEMPTS}`,
    );

    tick(VerifierService.CATALOG_FETCH_DELAY_MS);
    httpTesting.expectOne(catalogUrl).flush({ verifiers: [] });

    expect(statusText()).toBeNull();
  }));

  it('drops the status line once the fetch is given up on', () => {
    httpTesting.expectOne(catalogUrl).flush('bug', { status: 500, statusText: 'Internal Server Error' });

    expect(statusText()).toBeNull();
  });

  describe('getDescription for a select Setting', () => {
    const selectSetting = (defaultValue: string) => ({
      id: 'sel', label: 'Sel', type: 'select' as const, default: defaultValue,
      options: [{ id: 'optionA', label: 'Option A' }, { id: 'optionB', label: 'Option B' }],
    });

    beforeEach(() => {
      httpTesting.expectOne(catalogUrl).flush({ verifiers: [] });
    });

    it("shows the matching option's label, not the raw id, with a description", () => {
      const field = { ...selectSetting('optionA'), description: 'Pick one' };

      expect(component.getDescription(field)).toBe('Pick one (default: Option A)');
    });

    it("shows the matching option's label, not the raw id, without a description", () => {
      const field = selectSetting('optionA');

      expect(component.getDescription(field)).toBe('Default: Option A');
    });

    it('falls back to the raw id when the default matches no option', () => {
      const field = selectSetting('missing');

      expect(component.getDescription(field)).toBe('Default: missing');
    });
  });

  describe("highlights each Verifier by its result on the open diagram's root", () => {
    const verifier = (id: string, label: string): Verifier => ({
      id, label, enabled: true, toggleable: true,
      settings: [{ id: 'level', label: 'Level', type: 'text' }], variables: [],
    });
    const catalog: Verifier[] = [
      { id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [] },
      verifier('energy', 'Energy'),
      verifier('security', 'Security'),
    ];

    function openDiagram(rootEntries: IVerifiers): void {
      const root = new RootStatement('root', new Condition('true'), new Condition('true'), undefined);
      root.verifiers = rootEntries;
      TestBed.inject(TreeService).setFormula(new LocalCBCFormula('f', root), 'urn');
    }

    /** The classes of the accordion panel showing the Verifier with this label. */
    function panelClasses(label: string): string[] {
      fixture.detectChanges();
      const panels: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('p-accordion-panel'));
      const panel = panels.find((candidate) => candidate.textContent!.includes(label))!;
      return Array.from(panel.classList);
    }

    const resultClasses = (label: string) =>
      panelClasses(label).filter((cls) => cls.startsWith('verifier-result--'));

    beforeEach(() => {
      httpTesting.expectOne(catalogUrl).flush({ verifiers: catalog });
    });

    it('shows the grey no-result border with no diagram open', () => {
      expect(resultClasses('Functional correctness')).toEqual(['verifier-result--none']);
      expect(resultClasses('Energy')).toEqual(['verifier-result--none']);
    });

    it("reads the root's entries, keeps PrimeNG's own panel class, and follows a diagram switch", () => {
      openDiagram({
        func: { proven: true },
        energy: { proven: false, status: 'too hungry' },
        security: { proven: false, disabled: true },
      });

      expect(resultClasses('Functional correctness')).toEqual(['verifier-result--proven']);
      expect(resultClasses('Energy')).toEqual(['verifier-result--failed']);
      expect(resultClasses('Security')).toEqual(['verifier-result--none']);
      expect(panelClasses('Energy')).toContain('p-accordionpanel');

      openDiagram({ func: { proven: false } });

      expect(resultClasses('Functional correctness')).toEqual(['verifier-result--failed']);
      expect(resultClasses('Energy')).toEqual(['verifier-result--none']);
    });

    it('dims, but keeps, the result of a Verifier switched off now, a missing result included', () => {
      openDiagram({ func: { proven: true }, energy: { proven: false } });
      // Keep the override out of sessionStorage, where it would outlive this spec.
      spyOn(TestBed.inject(ProjectService), 'saveVerifierOverrides');

      component.onToggle(catalog[1], false);
      component.onToggle(catalog[2], false);

      expect(resultClasses('Energy')).toEqual(['verifier-result--failed', 'verifier-result--off']);
      expect(resultClasses('Security')).toEqual(['verifier-result--none', 'verifier-result--off']);
      expect(resultClasses('Functional correctness')).toEqual(['verifier-result--proven']);
    });

    it('turns only the Verifier whose setting changed stale', () => {
      openDiagram({ func: { proven: true }, energy: { proven: true }, security: { proven: false } });
      // Keep the override out of sessionStorage, where it would outlive this spec.
      spyOn(TestBed.inject(ProjectService), 'saveVerifierOverrides');

      TestBed.inject(VerifierService).updateSetting('energy', 'level', '3');

      expect(resultClasses('Energy')).toEqual(['verifier-result--stale']);
      expect(resultClasses('Security')).toEqual(['verifier-result--failed']);
      expect(resultClasses('Functional correctness')).toEqual(['verifier-result--proven']);
    });
  });

  describe('switching a Verifier off and on again through its header toggle', () => {
    const everyKind: Verifier = {
      id: 'kinds', label: 'Every kind', enabled: true, toggleable: true,
      settings: [
        { id: 'text', label: 'Text', type: 'text', default: 'abc' },
        { id: 'num', label: 'Num', type: 'text', valueType: 'number', default: '3' },
        { id: 'sel', label: 'Sel', type: 'select', default: 'b',
          options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
        { id: 'flag', label: 'Flag', type: 'boolean', default: true },
      ],
      variables: [],
    };

    /** Clicks the header toggle of the Verifier with this label, as the user does. */
    function clickHeaderToggle(label: string): void {
      const panels: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('p-accordion-panel'));
      const panel = panels.find((candidate) => candidate.textContent!.includes(label))!;
      const toggle: HTMLElement = panel.querySelector('p-accordion-header p-toggleswitch')!;
      toggle.click();
      fixture.detectChanges();
    }

    it('keeps a result stamped with the current settings fresh, with the settings body rendered in between', fakeAsync(() => {
      httpTesting.expectOne(catalogUrl).flush({
        verifiers: [
          { id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [] },
          everyKind,
        ],
      });
      // Keep the override out of sessionStorage, where it would outlive this spec.
      spyOn(TestBed.inject(ProjectService), 'saveVerifierOverrides');
      const verifierService = TestBed.inject(VerifierService);
      fixture.detectChanges();

      // A setting changed earlier, then a run with the Verifier enabled landed under it.
      verifierService.updateSetting('kinds', 'text', 'xyz');
      const stamp = verifierService.settingsStamp('kinds');
      const root = new RootStatement('root', new Condition('true'), new Condition('true'), undefined);
      root.verifiers = { func: { proven: true }, kinds: { proven: true, settingsUpdatedAt: stamp } };
      TestBed.inject(TreeService).setFormula(new LocalCBCFormula('f', root), 'urn');
      fixture.detectChanges();
      // NgModel writes its value into the toggle a microtask later.
      tick();
      fixture.detectChanges();
      const panelResult = () => {
        const panels: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('p-accordion-panel'));
        const panel = panels.find((candidate) => candidate.textContent!.includes('Every kind'))!;
        return Array.from(panel.classList).filter((cls) => cls.startsWith('verifier-result--'));
      };
      expect(panelResult()).toEqual(['verifier-result--proven']);

      // The user has the settings section open, as after changing the setting above.
      component.updateExpandedSections(['kinds']);
      fixture.detectChanges();
      tick(500);
      fixture.detectChanges();

      const updateSetting = spyOn(verifierService, 'updateSetting').and.callThrough();
      const enabled = () => verifierService.verifiers().find((verifier) => verifier.id === 'kinds')!.enabled;
      clickHeaderToggle('Every kind');
      tick(500);
      fixture.detectChanges();
      expect(enabled()).toBe(false);
      clickHeaderToggle('Every kind');
      tick(500);
      fixture.detectChanges();
      expect(enabled()).toBe(true);

      expect(fixture.nativeElement.querySelectorAll('p-accordion-content input').length).toBeGreaterThan(0);
      expect(updateSetting).not.toHaveBeenCalled();
      expect(verifierService.settingsStamp('kinds')).toBe(stamp);
      expect(panelResult()).toEqual(['verifier-result--proven']);
      expect(root.nodeState).toBe('verified-all');
    }));
  });

  describe('an optional select Setting can be cleared back to no value', () => {
    const options = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
    const func: Verifier = {
      id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [],
    };
    const optionalCatalog: Verifier[] = [
      func,
      {
        id: 'v', label: 'V', enabled: true, toggleable: true,
        // A default so the select starts on a real option, not already on "None".
        settings: [{ id: 'mode', label: 'Mode', type: 'select', required: false, default: 'a', options }],
        variables: [],
      },
    ];
    const requiredCatalog: Verifier[] = [
      func,
      {
        id: 'v', label: 'V', enabled: true, toggleable: true,
        settings: [{ id: 'mode', label: 'Mode', type: 'select', required: true, default: 'a', options }],
        variables: [],
      },
    ];

    let loader: HarnessLoader;

    beforeEach(() => {
      loader = TestbedHarnessEnvironment.loader(fixture);
    });

    it('renders a None option first for an optional select', async () => {
      httpTesting.expectOne(catalogUrl).flush({ verifiers: optionalCatalog });
      component.updateExpandedSections(['v']);
      fixture.detectChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const selectOptions = await select.getOptions();
      const labels = await parallel(() => selectOptions.map((option) => option.getText()));

      expect(labels[0]).toBe('None');
    });

    it('renders no None option for a required select', async () => {
      httpTesting.expectOne(catalogUrl).flush({ verifiers: requiredCatalog });
      component.updateExpandedSections(['v']);
      fixture.detectChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const selectOptions = await select.getOptions();
      const labels = await parallel(() => selectOptions.map((option) => option.getText()));

      expect(labels).not.toContain('None');
    });

    it('selecting None calls updateSetting with ""', async () => {
      httpTesting.expectOne(catalogUrl).flush({ verifiers: optionalCatalog });
      const verifierService = TestBed.inject(VerifierService);
      // Keep the override out of sessionStorage, where it would outlive this spec.
      spyOn(TestBed.inject(ProjectService), 'saveVerifierOverrides');
      const updateSetting = spyOn(verifierService, 'updateSetting').and.callThrough();
      component.updateExpandedSections(['v']);
      fixture.detectChanges();

      const select = await loader.getHarness(MatSelectHarness);
      await select.clickOptions({ text: 'None' });

      expect(updateSetting).toHaveBeenCalledWith('v', 'mode', '');
    });
  });

  describe("shows a saved value it can't represent as invalid, instead of the default", () => {
    const options = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
    const func: Verifier = {
      id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [],
    };
    const catalog: Verifier[] = [
      func,
      {
        id: 'v', label: 'V', enabled: true, toggleable: true,
        settings: [
          { id: 'text', label: 'Text', type: 'text', default: 'd' },
          { id: 'num', label: 'Num', type: 'text', valueType: 'number', default: '1' },
          { id: 'sel', label: 'Sel', type: 'select', required: false, default: 'a', options },
          { id: 'reqSel', label: 'ReqSel', type: 'select', required: true, default: 'a', options },
          { id: 'flag', label: 'Flag', type: 'boolean', default: true },
        ],
        variables: [],
      },
    ];

    /** The `.field` container of the Setting labeled `label`. */
    function fieldContainer(label: string): HTMLElement {
      fixture.detectChanges();
      const fields: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.field'));
      return fields.find(
        (el) =>
          el.querySelector('mat-label')?.textContent?.trim() === label ||
          el.querySelector('.boolean-label')?.textContent?.trim() === label,
      )!;
    }

    /** The mat-error (or the boolean field's own error element) shown under the Setting labeled `label`, or `null` if none is shown. */
    function fieldErrorText(label: string): string | null {
      const error = fieldContainer(label).querySelector('mat-error, .boolean-field-error');
      return error ? error.textContent!.replace(/\s+/g, ' ').trim() : null;
    }

    /** Loads a Catalog whose "v" Verifier already carries the given saved override, as on project load. */
    function loadWithSavedOverride(settings: Record<string, unknown>): void {
      spyOn(TestBed.inject(ProjectService), 'getVerifierOverrides').and.returnValue({
        v: { settings: settings as Record<string, string | boolean> },
      });
      spyOn(TestBed.inject(ProjectService), 'saveVerifierOverrides');
      TestBed.inject(ProjectService).verifierOverridesLoaded.next();
      httpTesting.expectOne(catalogUrl).flush({ verifiers: catalog });
      component.updateExpandedSections(['v']);
    }

    it('flags a wrong-typed text Setting, shows the saved value as JSON text, and blocks the run gate', fakeAsync(() => {
      loadWithSavedOverride({ text: 5 });
      fixture.detectChanges();
      tick();

      expect(fieldErrorText('Text')).toBe('Saved value has the wrong type');
      const input: HTMLInputElement = fieldContainer('Text').querySelector('input[matInput]')!;
      expect(input.value).toBe('5');
      expect(TestBed.inject(VerifierService).verifiersValid()).toBeFalse();
    }));

    it('flags a wrong-typed number Setting, even when its JSON text fails the number grammar', fakeAsync(() => {
      // "null" fails NUMBER_GRAMMAR, so a naive error chain would show "Must be a number"
      // instead of the more specific savedValueError text.
      loadWithSavedOverride({ num: null });
      fixture.detectChanges();
      tick();

      expect(fieldErrorText('Num')).toBe('Saved value has the wrong type');
      const input: HTMLInputElement = fieldContainer('Num').querySelector('input[matInput]')!;
      expect(input.value).toBe('null');
    }));

    it('flags an unknown select option, naming the saved id, and shows nothing selected', fakeAsync(() => {
      loadWithSavedOverride({ sel: 'gone' });
      fixture.detectChanges();
      tick();

      expect(fieldErrorText('Sel')).toBe("Saved option 'gone' is not available");
      const selected = TestBed.inject(VerifierService)
        .verifiers().find((v) => v.id === 'v')!
        .settings.find((s) => s.id === 'sel')!;
      expect(selected.input).toBe('gone');
    }));

    it('flags a wrong-typed boolean Setting and shows the toggle off, not the default', fakeAsync(() => {
      loadWithSavedOverride({ flag: 'yes' });
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fieldErrorText('Flag')).toBe('Saved value has the wrong type');
      const fields: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.field'));
      const flagField = fields.find((el) => el.querySelector('.boolean-label')?.textContent?.trim() === 'Flag')!;
      const toggle = flagField.querySelector('[role="switch"]')!;
      expect(toggle.getAttribute('aria-checked')).toBe('false');
    }));

    it('clears the error once the field is changed to a well-typed value', fakeAsync(() => {
      loadWithSavedOverride({ text: 5 });
      fixture.detectChanges();
      tick();
      expect(fieldErrorText('Text')).toBe('Saved value has the wrong type');

      TestBed.inject(VerifierService).updateSetting('v', 'text', 'typed');
      fixture.detectChanges();
      tick();

      expect(fieldErrorText('Text')).toBeNull();
      expect(TestBed.inject(VerifierService).verifiersValid()).toBeTrue();
    }));

    it("shows \"This field is required\" for a required select left at \"\", with no wrong-type/unknown-option error", fakeAsync(() => {
      httpTesting.expectOne(catalogUrl).flush({ verifiers: catalog });
      // Keep the override out of sessionStorage, where it would outlive this spec.
      spyOn(TestBed.inject(ProjectService), 'saveVerifierOverrides');
      component.updateExpandedSections(['v']);
      fixture.detectChanges();
      tick();

      TestBed.inject(VerifierService).updateSetting('v', 'reqSel', '');
      fixture.detectChanges();
      tick();

      expect(fieldErrorText('ReqSel')).toBe('This field is required');
    }));
  });

  describe("a Verifier's Variables list", () => {
    it('renders each Variable by its id and type, with no separate name', () => {
      httpTesting.expectOne(catalogUrl).flush({
        verifiers: [
          { id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [] },
          {
            id: 'vars', label: 'Variables', enabled: true, toggleable: true, settings: [],
            variables: [{ id: 'energyBudget', type: 'double' }],
          },
        ],
      });
      component.updateExpandedSections(['vars']);
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('.variable');
      expect(item.textContent!.replace(/\s+/g, ' ').trim()).toBe('energyBudget: double');
    });

    function scopeText(allowFunctionalVariables?: boolean): string | null {
      httpTesting.expectOne(catalogUrl).flush({
        verifiers: [
          { id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [] },
          {
            id: 'vars', label: 'Variables', enabled: true, toggleable: true, settings: [],
            variables: [{ id: 'energyBudget', type: 'double' }], allowFunctionalVariables,
          },
        ],
      });
      component.updateExpandedSections(['vars']);
      fixture.detectChanges();

      const scope: HTMLElement | null = fixture.nativeElement.querySelector('.variables-scope');
      return scope && scope.textContent!.replace(/\s+/g, ' ').trim();
    }

    it('says Java Variables may be used too when the Verifier allows functional variables', () => {
      expect(scopeText(true)).toBe('Conditions for this verifier may use Java Variables and these:');
    });

    it('says only its own variables may be used when allowFunctionalVariables is false', () => {
      expect(scopeText(false)).toBe('Conditions for this verifier may use only these variables:');
    });

    it('says only its own variables may be used when allowFunctionalVariables is omitted', () => {
      expect(scopeText(undefined)).toBe('Conditions for this verifier may use only these variables:');
    });

    it('shows no scope line for a Verifier without variables', () => {
      httpTesting.expectOne(catalogUrl).flush({
        verifiers: [
          { id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [] },
          { id: 'plain', label: 'Plain', enabled: true, toggleable: true, settings: [{ id: 'level', label: 'Level', type: 'text' }], variables: [] },
        ],
      });
      component.updateExpandedSections(['plain']);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.variables-scope')).toBeNull();
    });
  });
});
