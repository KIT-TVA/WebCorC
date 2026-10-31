import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";

import { TreeService } from "./tree.service";
import { VerifierService } from "../verifier/verifier.service";
import { ProjectService } from "../project/project.service";
import { GlobalSettingsService } from "../global-settings.service";
import { environment } from "../../../environments/environment";
import { Verifier } from "../../types/Verifier";
import { LocalCBCFormula } from "../../types/CBCFormula";
import { RootStatement } from "../../types/statements/root-statement";
import { IAbstractStatement, IVerifiers, NodeState } from "../../types/statements/abstract-statement";
import { Condition } from "../../types/condition/condition";
import { CompositionStatement } from "../../types/statements/composition-statement";
import { Statement } from "../../types/statements/simple-statement";

describe("TreeService", () => {
  const catalogUrl = environment.apiUrl + "/editor/verifiers";

  const functionalVerifier: Verifier = {
    id: "func", label: "Functional correctness", enabled: true, toggleable: false, settings: [], variables: [],
  };
  const mockVerifier = (enabled: boolean): Verifier => ({
    id: "mock", label: "Mock", enabled, toggleable: true,
    settings: [{ id: "threshold", label: "Threshold", type: "text" }],
    variables: [],
  });

  let service: TreeService;
  let verifierService: VerifierService;
  let httpTesting: HttpTestingController;
  let projectServiceStub: Partial<ProjectService>;

  function loadCatalog(verifiers: Verifier[]): void {
    httpTesting.expectOne(catalogUrl).flush({ verifiers });
  }

  /** Builds a single-node tree (root only) with the given state/entries, via the public `setFormula` seam. */
  function buildRootNode(nodeState: NodeState, verifiers: IVerifiers): RootStatement {
    const root = new RootStatement("root", new Condition("true"), new Condition("true"), undefined);
    root.nodeState = nodeState;
    root.verifiers = verifiers;
    service.setFormula(new LocalCBCFormula("f", root), "urn");
    return root;
  }

  beforeEach(() => {
    projectServiceStub = {
      getVerifierOverrides: () => null,
      saveVerifierOverrides: () => undefined,
      verifierOverridesLoaded: new Subject<void>(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectService, useValue: projectServiceStub },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    verifierService = TestBed.inject(VerifierService);
    service = TestBed.inject(TreeService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("should be created", () => {
    loadCatalog([]);
    expect(service).toBeTruthy();
  });

  describe("overrides subscription", () => {
    it("setEnabled on a Verifier that ran keeps verified-all", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const root = buildRootNode("verified-all", {
        func: { proven: true },
        mock: { proven: true },
      });

      verifierService.setEnabled("mock", true);

      expect(root.nodeState).toBe("verified-all");
    });

    it("enabling a Verifier whose entry is disabled:true yields settings-changed", () => {
      loadCatalog([functionalVerifier, mockVerifier(false)]);
      const root = buildRootNode("verified-functional", {
        func: { proven: true },
        mock: { proven: false, disabled: true },
      });

      verifierService.setEnabled("mock", true);

      expect(root.nodeState).toBe("settings-changed");
    });

    it("updateSetting on an enabled Verifier flips verified-all nodes to settings-changed only", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const root = buildRootNode("verified-all", {
        func: { proven: true },
        mock: { proven: true },
      });

      verifierService.updateSetting("mock", "threshold", "5");

      expect(root.nodeState).toBe("settings-changed");
    });

    it("updateSetting on a Verifier that is not enabled leaves node state alone", () => {
      loadCatalog([functionalVerifier, mockVerifier(false)]);
      const root = buildRootNode("verified-functional", {
        func: { proven: true },
      });

      verifierService.updateSetting("mock", "threshold", "5");

      expect(root.nodeState).toBe("verified-functional");
    });
  });

  describe("mid-run change survival", () => {
    it("an id marked unverified during a run stays unverified after reapplyRunChanges, then clears", () => {
      loadCatalog([functionalVerifier]);
      const root = buildRootNode("verified-all", { func: { proven: true } });
      const globalSettingsService = TestBed.inject(GlobalSettingsService);
      globalSettingsService.isVerifying = true;
      service.beginRun();
      service.markSubtreeUnverified(service.rootStatement!);

      const resultStatement = {
        id: root.id, isProven: true, nodeState: "verified-all", verifiers: {},
      } as unknown as IAbstractStatement;
      service.reapplyRunChanges([resultStatement]);

      expect(resultStatement.nodeState).toBe("unverified");
      expect(resultStatement.isProven).toBeFalse();

      // Cleared afterward: a later call with the same id is no longer affected.
      const untouched = {
        id: root.id, isProven: true, nodeState: "verified-all", verifiers: {},
      } as unknown as IAbstractStatement;
      service.reapplyRunChanges([untouched]);
      expect(untouched.nodeState).toBe("verified-all");
    });

    it("does not mark ids edited outside of a run", () => {
      loadCatalog([functionalVerifier]);
      const root = buildRootNode("verified-all", { func: { proven: true } });
      const globalSettingsService = TestBed.inject(GlobalSettingsService);
      globalSettingsService.isVerifying = false;
      service.beginRun();
      service.markSubtreeUnverified(service.rootStatement!);

      const resultStatement = {
        id: root.id, isProven: true, nodeState: "verified-all", verifiers: {},
      } as unknown as IAbstractStatement;
      service.reapplyRunChanges([resultStatement]);

      expect(resultStatement.nodeState).toBe("verified-all");
    });
  });

  describe("functionalOnly toggle recomputes node state live (Fix A)", () => {
    it("flips an already-rendered node between settings-changed and verified-functional without a new run, and back", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      // In all-mode, a disabled entry for a currently-enabled id derives settings-changed
      // (row 5); the effect must recompute this from the toggle alone, no run involved.
      const root = buildRootNode("verified-all", {
        func: { proven: true },
        mock: { proven: false, disabled: true },
      });
      TestBed.tick();
      expect(root.nodeState).toBe("settings-changed");

      verifierService.setFunctionalOnly(true);
      TestBed.tick();
      expect(root.nodeState).toBe("verified-functional");

      verifierService.setFunctionalOnly(false);
      TestBed.tick();
      expect(root.nodeState).toBe("settings-changed");
    });

    it("does not throw when the toggle flips before any formula is loaded", () => {
      loadCatalog([functionalVerifier]);

      expect(() => {
        verifierService.setFunctionalOnly(true);
        TestBed.tick();
        verifierService.setFunctionalOnly(false);
        TestBed.tick();
      }).not.toThrow();
    });
  });

  describe("settings stamp: stale is derived from the entries and the current Overrides", () => {
    /** Overrides as a project load would bring them, with `mock` last changed at `stamp`. */
    function loadOverridesWithStamp(stamp: number): void {
      projectServiceStub.getVerifierOverrides = () => ({ mock: { settings: {}, settingsUpdatedAt: stamp } });
      (projectServiceStub.verifierOverridesLoaded as Subject<void>).next();
    }

    it("verified-all -> setting changed -> settings-changed -> disable -> verified-functional -> re-enable -> settings-changed (not verified-all)", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const root = buildRootNode("verified-all", {
        func: { proven: true },
        mock: { proven: true },
      });

      verifierService.updateSetting("mock", "threshold", "5");
      expect(root.nodeState).toBe("settings-changed");

      verifierService.setEnabled("mock", false);
      expect(root.nodeState).toBe("verified-functional");

      verifierService.setEnabled("mock", true);
      expect(root.nodeState).toBe("settings-changed");
    });

    it("a diagram whose entries carry an older stamp shows the Verifier stale when loaded, card included", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      loadOverridesWithStamp(7);

      const root = buildRootNode("verified-all", {
        func: { proven: true },
        mock: { proven: true, settingsUpdatedAt: 5 },
      });

      expect(service.verifierResult(root, "mock")).toBe("stale");
      expect(root.nodeState).toBe("settings-changed");
    });

    it("an entry without a stamp is stale once the Overrides carry one, and fresh while neither does", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const root = buildRootNode("verified-all", { func: { proven: true }, mock: { proven: false } });
      expect(service.verifierResult(root, "mock")).toBe("failed");
      expect(root.nodeState).toBe("failed-non-functional");

      loadOverridesWithStamp(7);
      TestBed.tick();

      expect(service.verifierResult(root, "mock")).toBe("stale");
      expect(root.nodeState).toBe("settings-changed");
    });

    it("a result carrying the current stamp is fresh, and disable -> re-enable without a setting change keeps it fresh", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      loadOverridesWithStamp(7);
      const root = buildRootNode("verified-all", {
        func: { proven: true },
        mock: { proven: true, settingsUpdatedAt: 7 },
      });
      expect(root.nodeState).toBe("verified-all");

      verifierService.setEnabled("mock", false);
      expect(root.nodeState).toBe("verified-functional");
      verifierService.setEnabled("mock", true);

      expect(root.nodeState).toBe("verified-all");
      expect(service.verifierResult(root, "mock")).toBe("proven");
    });

    it("derives a landing result's card state through the stamp comparison", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      loadOverridesWithStamp(7);
      buildRootNode("verified-all", { func: { proven: true } });

      expect(service.deriveNodeState({ func: { proven: true }, mock: { proven: true, settingsUpdatedAt: 7 } }))
        .toBe("verified-all");
      expect(service.deriveNodeState({ func: { proven: true }, mock: { proven: true, settingsUpdatedAt: 5 } }))
        .toBe("settings-changed");
      expect(service.deriveNodeState({ func: { proven: true }, mock: { proven: false, settingsUpdatedAt: 5 } }))
        .toBe("settings-changed");
    });
  });

  describe("statement edits clear the entries' results", () => {
    const otherVerifier: Verifier = {
      id: "other", label: "Other", enabled: true, toggleable: true,
      settings: [{ id: "level", label: "Level", type: "text" }],
      variables: [],
    };

    /** root -> composition -> (first, second), every statement verified by func and mock. */
    function buildTree() {
      const proven = (): IVerifiers => ({ func: { proven: true }, mock: { proven: true } });
      const first = new Statement("first", new Condition("true"), new Condition("true"));
      first.verifiers = {
        func: { proven: true },
        mock: { preCondition: new Condition("x > 0"), proven: false, status: "too slow" },
      };
      const second = new Statement("second", new Condition("true"), new Condition("true"));
      second.verifiers = proven();
      const composition = new CompositionStatement(
        "comp", new Condition("true"), new Condition("true"), new Condition("mid"), first, second,
      );
      composition.verifiers = proven();
      const root = new RootStatement("root", new Condition("true"), new Condition("true"), composition);
      root.verifiers = {
        func: { proven: true },
        mock: { proven: true, status: "whole run ok" },
        other: { proven: false, disabled: true },
      };
      service.setFormula(new LocalCBCFormula("f", root), "urn");
      return { root, composition, first, second };
    }

    it("an edit clears proven/status in the edited subtree and on the root, keeping conditions, disabled, the ancestors in between and the root's card state", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const { root, composition, first, second } = buildTree();
      const firstCondition = first.verifiers["mock"].preCondition;

      service.markSubtreeUnverified(service.findStatementNodeById(first.id)!);

      expect(first.verifiers).toEqual({ mock: { preCondition: firstCondition } });
      expect(root.verifiers).toEqual({ other: { disabled: true } });
      expect(first.nodeState).toBe("unverified");
      // Only the Root's entries are cleared; its card keeps its state until the next re-derivation.
      expect(root.nodeState).toBe("verified-all");
      expect(composition.verifiers).toEqual({ func: { proven: true }, mock: { proven: true } });
      expect(composition.nodeState).toBe("verified-all");
      expect(second.nodeState).toBe("verified-all");
    });

    it("an edit removes the settings stamp together with the result", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const condition = new Condition("x > 0");
      const root = buildRootNode("verified-all", {
        func: { proven: true },
        mock: { preCondition: condition, proven: true, settingsUpdatedAt: 7 },
      });

      service.markWholeTreeUnverified();

      expect(root.verifiers).toEqual({ mock: { preCondition: condition } });
    });

    it("a Verifier toggle or a mode switch after an edit doesn't bring the old green back", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const root = buildRootNode("verified-all", { func: { proven: true }, mock: { proven: true } });

      service.markWholeTreeUnverified();
      verifierService.setEnabled("mock", false);
      expect(root.nodeState).toBe("unverified");

      verifierService.setFunctionalOnly(true);
      TestBed.tick();
      expect(root.nodeState).toBe("unverified");
    });

    it("an edit during a run clears the result that lands for the edited statement and the root", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const { root, first } = buildTree();
      TestBed.inject(GlobalSettingsService).isVerifying = true;
      service.beginRun();
      service.markSubtreeUnverified(service.findStatementNodeById(first.id)!);

      first.verifiers = { func: { proven: true }, mock: { proven: true } };
      root.verifiers = { func: { proven: true }, mock: { proven: true } };
      service.reapplyRunChanges([root, first]);

      expect(service.verifierResult(first, "mock")).toBe("none");
      expect(service.verifierResult(root, "mock")).toBe("none");
      verifierService.setEnabled("mock", true);
      expect(first.nodeState).toBe("unverified");
      expect(root.nodeState).toBe("unverified");
    });

    it("setFormula recomputes nodeState from the entries", () => {
      loadCatalog([functionalVerifier, mockVerifier(true)]);
      const { root, composition, first } = buildTree();

      expect(root.nodeState).toBe("verified-all");
      expect(composition.nodeState).toBe("verified-all");
      expect(first.nodeState).toBe("failed-non-functional");
    });

    it("recomputes nodeState once the Catalog arrives after the diagram was loaded", () => {
      TestBed.tick();
      const root = new RootStatement("root", new Condition("true"), new Condition("true"), undefined);
      root.verifiers = { func: { proven: true }, mock: { proven: false } };
      service.setFormula(new LocalCBCFormula("f", root), "urn");
      expect(root.nodeState).toBe("verified-functional");

      loadCatalog([functionalVerifier, mockVerifier(true)]);
      TestBed.tick();

      expect(root.nodeState).toBe("failed-non-functional");
    });

    it("the per-Verifier query shows only the changed Verifier stale, and the Functional Verifier never", () => {
      loadCatalog([functionalVerifier, mockVerifier(true), otherVerifier]);
      const root = buildRootNode("verified-all", {
        func: { proven: true },
        mock: { proven: true },
        other: { proven: false },
      });
      expect(service.verifierResult(root, "mock")).toBe("proven");

      verifierService.updateSetting("mock", "threshold", "5");
      verifierService.updateSetting("func", "any", "1");

      expect(service.verifierResult(root, "mock")).toBe("stale");
      expect(service.verifierResult(root, "other")).toBe("failed");
      expect(service.verifierResult(root, "func")).toBe("proven");
    });
  });
});
