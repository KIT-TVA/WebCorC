import { Verifier, VerifierOverrides } from "../../types/Verifier";
import { applyOverrides } from "./verifier-overrides";

describe("applyOverrides", () => {
  it("returns base verifiers with each setting's input seeded from its default when no overrides exist", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          { id: "withDefault", label: "a", type: "text", required: true, default: "d" },
          { id: "withoutDefault", label: "b", type: "text" },
        ],
        variables: [],
      },
    ];

    const merged = applyOverrides(base, {});

    expect(merged[0].settings[0].input).toBe("d");
    expect(merged[0].settings[1].input).toBe("");
    expect(merged[0].enabled).toBeTrue();
  });

  it("applies an enabled override on a toggleable verifier", () => {
    const base: Verifier[] = [
      { id: "v", label: "V", enabled: false, statusPlaceholder: "", settings: [], variables: [] },
    ];
    const overrides: VerifierOverrides = { v: { enabled: true, settings: {} } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].enabled).toBeTrue();
  });

  it("rejects an enabled override on a toggleable:false verifier and logs the rejected value", () => {
    const base: Verifier[] = [
      { id: "v", label: "V", enabled: true, statusPlaceholder: "", toggleable: false, settings: [], variables: [] },
    ];
    const overrides: VerifierOverrides = { v: { enabled: false, settings: {} } };
    const debug = spyOn(console, "debug");

    const merged = applyOverrides(base, overrides);

    expect(merged[0].enabled).toBeTrue();
    expect(debug).toHaveBeenCalled();
    const message = debug.calls.mostRecent().args.join(" ");
    expect(message).toContain("v");
    expect(message).toContain("false");
    expect(message).toContain("true");
  });

  it("applies a text setting override verbatim over its default", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [{ id: "s", label: "s", type: "text", default: "d" }],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = { v: { settings: { s: "typed" } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBe("typed");
  });

  it("keeps an unknown select option verbatim and marks it unknown-option, without falling back to the default", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          {
            id: "sel",
            label: "sel",
            type: "select",
            required: true,
            default: "a",
            options: [
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
          },
        ],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = { v: { settings: { sel: "gone" } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBe("gone");
    expect(merged[0].settings[0].savedValueError).toEqual({ value: "gone", reason: "unknown-option" });
  });

  it("resolves an optional select's \"\" override to \"\" even when it has a default", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          {
            id: "sel",
            label: "sel",
            type: "select",
            required: false,
            default: "a",
            options: [
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
          },
        ],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = { v: { settings: { sel: "" } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBe("");
  });

  it("keeps a required select's \"\" override as \"\" (plain required-but-empty, no marker)", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          {
            id: "sel",
            label: "sel",
            type: "select",
            required: true,
            default: "a",
            options: [
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
          },
        ],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = { v: { settings: { sel: "" } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBe("");
    expect(merged[0].settings[0].savedValueError).toBeUndefined();
  });

  it("keeps a select setting's non-string override as \"\" and marks it wrong-type", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          {
            id: "sel",
            label: "sel",
            type: "select",
            required: false,
            default: "a",
            options: [
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
          },
        ],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = { v: { settings: { sel: true } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBe("");
    expect(merged[0].settings[0].savedValueError).toEqual({ value: true, reason: "wrong-type" });
  });

  it("seeds a boolean setting from its default and applies a boolean override verbatim", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          { id: "seeded", label: "seeded", type: "boolean", default: true },
          { id: "flag", label: "flag", type: "boolean", default: false },
        ],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = { v: { settings: { flag: true } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBeTrue();
    expect(merged[0].settings[1].input).toBeTrue();
  });

  it("leaves a boolean setting's input unset and marks it wrong-type when the override is not a boolean, without falling back to the default", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          { id: "flag", label: "flag", type: "boolean", default: true },
        ],
        variables: [],
      },
    ];
    // the legacy canonical-string form must be rejected too, not silently coerced
    const overrides: VerifierOverrides = { v: { settings: { flag: "true" } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBeUndefined();
    expect(merged[0].settings[0].savedValueError).toEqual({ value: "true", reason: "wrong-type" });
  });

  it("keeps a non-string text setting override as JSON text and marks it wrong-type, without falling back to the default", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [{ id: "s", label: "s", type: "text", default: "d" }],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = { v: { settings: { s: true } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBe("true");
    expect(merged[0].settings[0].savedValueError).toEqual({ value: true, reason: "wrong-type" });
  });

  it("keeps a numeric text setting override as JSON text and marks it wrong-type, even a JSON type outside the declared override union (e.g. a raw number or null)", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          { id: "n", label: "n", type: "text", valueType: "number", default: "1" },
        ],
        variables: [],
      },
    ];
    const overrides = { v: { settings: { n: 5 } } } as unknown as VerifierOverrides;

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBe("5");
    expect(merged[0].settings[0].savedValueError).toEqual({ value: 5, reason: "wrong-type" });
  });

  it("passes a numeric text override through verbatim even when out of range", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [
          { id: "n", label: "n", type: "text", valueType: "number", range: { min: 0, max: 10 } },
        ],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = { v: { settings: { n: "20" } } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings[0].input).toBe("20");
  });

  it("drops overrides for unknown verifier ids silently and logs a note", () => {
    const base: Verifier[] = [
      { id: "v", label: "V", enabled: true, statusPlaceholder: "", settings: [], variables: [] },
    ];
    const overrides: VerifierOverrides = {
      ghost: { enabled: false, settings: { s: "x" } },
    };
    const debug = spyOn(console, "debug");

    const merged = applyOverrides(base, overrides);

    expect(merged.length).toBe(1);
    expect(merged[0].id).toBe("v");
    expect(debug).toHaveBeenCalled();
    expect(debug.calls.mostRecent().args.join(" ")).toContain("ghost");
  });

  it("drops overrides for unknown setting ids within a known verifier and logs a note", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        settings: [{ id: "known", label: "known", type: "text", default: "d" }],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = {
      v: { settings: { known: "kept", unknown: "dropped" } },
    };
    const debug = spyOn(console, "debug");

    const merged = applyOverrides(base, overrides);

    expect(merged[0].settings.length).toBe(1);
    expect(merged[0].settings[0].input).toBe("kept");
    expect(debug).toHaveBeenCalled();
    const message = debug.calls.mostRecent().args.join(" ");
    expect(message).toContain("v");
    expect(message).toContain("unknown");
  });

  it("still applies setting overrides for a toggleable:false verifier even though its enabled override is rejected", () => {
    const base: Verifier[] = [
      {
        id: "v",
        label: "V",
        enabled: true,
        statusPlaceholder: "",
        toggleable: false,
        settings: [{ id: "s", label: "s", type: "text", default: "d" }],
        variables: [],
      },
    ];
    const overrides: VerifierOverrides = {
      v: { enabled: false, settings: { s: "typed" } },
    };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].enabled).toBeTrue();
    expect(merged[0].settings[0].input).toBe("typed");
  });

  it("passes allowFunctionalVariables through from the base and leaves it undefined when unset", () => {
    const base: Verifier[] = [
      {
        id: "allowed",
        label: "Allowed",
        enabled: true,
        settings: [],
        variables: [{ id: "x", type: "int" }],
        allowFunctionalVariables: true,
      },
      { id: "unset", label: "Unset", enabled: true, settings: [], variables: [] },
    ];
    const overrides: VerifierOverrides = { allowed: { enabled: false, settings: {} } };

    const merged = applyOverrides(base, overrides);

    expect(merged[0].allowFunctionalVariables).toBeTrue();
    expect(merged[1].allowFunctionalVariables).toBeUndefined();
  });
});