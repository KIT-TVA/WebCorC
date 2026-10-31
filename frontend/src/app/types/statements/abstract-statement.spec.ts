import {
  IVerifierEntry,
  IVerifiers,
  nodeStateFor,
  sparseVerifierEntry,
  VerifierResult,
  verifierResultFor,
} from "./abstract-statement";
import { FUNCTIONAL_VERIFIER_ID } from "../Verifier";

describe("verifierResultFor", () => {
  const cases: [string, IVerifierEntry | undefined, boolean, VerifierResult][] = [
    ["proven", { proven: true }, false, "proven"],
    ["failed", { proven: false, status: "timed out" }, false, "failed"],
    ["no entry", undefined, false, "none"],
    ["no proven", { preCondition: { condition: "x > 0" } } as IVerifierEntry, false, "none"],
    ["disabled: true", { proven: false, disabled: true }, false, "none"],
    ["dirty proven", { proven: true }, true, "stale"],
    ["dirty failed", { proven: false }, true, "stale"],
    ["dirty without a result", { disabled: true }, true, "none"],
  ];

  for (const [name, entry, dirty, expected] of cases) {
    it(`${name} -> ${expected}`, () => {
      expect(verifierResultFor(entry, dirty)).toBe(expected);
    });
  }
});

describe("sparseVerifierEntry", () => {
  it("keeps the settings stamp alongside the result", () => {
    expect(sparseVerifierEntry({ proven: true, settingsUpdatedAt: 1727000000000, preCondition: { condition: "" } }))
      .toEqual({ proven: true, settingsUpdatedAt: 1727000000000 });
  });
});

describe("nodeStateFor", () => {
  it("returns unverified when func entry is absent", () => {
    expect(nodeStateFor(undefined, ["mock"])).toBe("unverified");
    expect(nodeStateFor({}, ["mock"])).toBe("unverified");
  });

  it("returns failed when func proven is false", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: false },
    };
    expect(nodeStateFor(verifiers, [])).toBe("failed");
  });

  it("returns failed when func fails even if an enabled id is disabled", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: false },
      mock: { proven: false, disabled: true },
    };
    expect(nodeStateFor(verifiers, ["mock"])).toBe("failed");
  });

  it("returns failed-non-functional when some enabled id has proven:false and not disabled", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
      mock: { proven: false },
    };
    expect(nodeStateFor(verifiers, ["mock"])).toBe("failed-non-functional");
  });

  it("returns failed-non-functional when one enabled id is proven:false and another is disabled", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
      failVerifier: { proven: false },
      disabledVerifier: { proven: false, disabled: true },
    };
    expect(nodeStateFor(verifiers, ["failVerifier", "disabledVerifier"])).toBe("failed-non-functional");
  });

  it("returns verified-functional when enabledVerifiers is empty and func is proven", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
      mock: { proven: true },
    };
    expect(nodeStateFor(verifiers, [])).toBe("verified-functional");
  });

  it("returns settings-changed when every enabled id is disabled", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
      mock1: { proven: false, disabled: true },
      mock2: { proven: false, disabled: true },
    };
    expect(nodeStateFor(verifiers, ["mock1", "mock2"])).toBe("settings-changed");
  });

  it("returns settings-changed when some (not all) enabled ids are disabled and others proven", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
      mock1: { proven: true },
      mock2: { proven: false, disabled: true },
    };
    expect(nodeStateFor(verifiers, ["mock1", "mock2"])).toBe("settings-changed");
  });

  it("treats an entry missing for an enabled id as disabled", () => {
    // Missing entry behaves as disabled: if all enabled are missing/disabled -> settings-changed
    const verifiersOnlyFunc: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
    };
    expect(nodeStateFor(verifiersOnlyFunc, ["newCatalogVerifier"])).toBe("settings-changed");

    // If one is proven and one is missing -> settings-changed
    const verifiersOneProven: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
      ranVerifier: { proven: true },
    };
    expect(nodeStateFor(verifiersOneProven, ["ranVerifier", "newCatalogVerifier"])).toBe("settings-changed");
  });

  it("returns verified-all when every enabled id has proven:true", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
      mock1: { proven: true },
      mock2: { proven: true },
    };
    expect(nodeStateFor(verifiers, ["mock1", "mock2"])).toBe("verified-all");
  });

  it("ignores disabled verifiers that are not currently enabled", () => {
    const verifiers: IVerifiers = {
      [FUNCTIONAL_VERIFIER_ID]: { proven: true },
      mock1: { proven: true },
      mock2: { proven: false, disabled: true },
    };
    // mock2 is in verifiers, but not in enabledIds
    expect(nodeStateFor(verifiers, ["mock1"])).toBe("verified-all");
  });
});
