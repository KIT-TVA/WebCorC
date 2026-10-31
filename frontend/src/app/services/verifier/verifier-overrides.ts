import { SavedValueError, Verifier, VerifierOverrides } from "../../types/Verifier";

/**
 * Merges a sparse {@link VerifierOverrides} record onto the read-only base catalog into the
 * {@link Verifier} list consumers render. Pure — neither argument is mutated.
 *
 * A present override is never replaced by the default: one the field can't represent is marked
 * with {@link SavedValueError}. Out-of-range numeric text passes through unsanitized. Orphan
 * override entries are hidden here but kept in the record, since their Verifier may only be
 * offline.
 */
export function applyOverrides(
  base: Verifier[],
  overrides: VerifierOverrides,
): Verifier[] {
  const baseIds = new Set(base.map((v) => v.id));
  for (const overrideId of Object.keys(overrides)) {
    if (!baseIds.has(overrideId)) {
      console.debug(
        `Verifier override for unknown id "${overrideId}" dropped (not present in base catalog).`,
      );
    }
  }

  return base.map((verifier) => {
    const override = overrides[verifier.id];
    const enabled = resolveEnabled(verifier, override?.enabled);
    const settingIds = new Set(verifier.settings.map((s) => s.id));
    if (override) {
      for (const settingId of Object.keys(override.settings)) {
        if (!settingIds.has(settingId)) {
          console.debug(
            `Verifier setting override for unknown id "${verifier.id}.${settingId}" dropped (not present in base verifier's settings).`,
          );
        }
      }
    }
    return {
      ...verifier,
      enabled,
      settings: verifier.settings.map((setting) => {
        const overrideInput = override?.settings?.[setting.id];
        if (setting.type === "boolean") {
          const resolved = resolveBooleanInput(setting, overrideInput);
          return { ...setting, input: resolved.input, savedValueError: resolved.savedValueError };
        }
        const resolved = resolveStringInput(setting, overrideInput);
        return { ...setting, input: resolved.input, savedValueError: resolved.savedValueError };
      }),
      variables: verifier.variables,
    };
  });
}

function resolveStringInput(
  setting: Exclude<Verifier["settings"][number], { type: "boolean" }>,
  overrideInput: string | boolean | undefined,
): { input: string; savedValueError?: SavedValueError } {
  if (overrideInput === undefined) {
    return { input: setting.default ?? "" };
  }
  if (typeof overrideInput !== "string") {
    return {
      // A select has nothing to show for a non-string value; a text field round-trips it as
      // JSON so the user sees exactly what was saved (e.g. `5`, `null`, `true`).
      input: setting.type === "select" ? "" : JSON.stringify(overrideInput),
      savedValueError: { value: overrideInput, reason: "wrong-type" },
    };
  }
  if (setting.type === "select" && overrideInput === "") {
    // "" is either "no value" (an optional select, legal even with a default) or "required
    // but empty" (a required select) — both are present values kept verbatim, with no marker;
    // isSettingValid's own required-but-empty check catches the latter.
    return { input: overrideInput };
  }
  if (
    setting.type === "select" &&
    !setting.options.some((option) => option.id === overrideInput)
  ) {
    return {
      input: overrideInput,
      savedValueError: { value: overrideInput, reason: "unknown-option" },
    };
  }
  return { input: overrideInput };
}

/** A wrong-typed value leaves `input` unset rather than defaulted. */
function resolveBooleanInput(
  setting: Extract<Verifier["settings"][number], { type: "boolean" }>,
  overrideInput: string | boolean | undefined,
): { input?: boolean; savedValueError?: SavedValueError } {
  if (overrideInput === undefined) {
    return { input: setting.default };
  }
  if (typeof overrideInput !== "boolean") {
    return { savedValueError: { value: overrideInput, reason: "wrong-type" } };
  }
  return { input: overrideInput };
}

function resolveEnabled(
  verifier: Verifier,
  overrideEnabled: boolean | undefined,
): boolean {
  if (verifier.toggleable === false) {
    if (overrideEnabled !== undefined && overrideEnabled !== verifier.enabled) {
      console.debug(
        `Verifier "${verifier.id}" is not toggleable; ignoring saved enabled=${overrideEnabled}, using base enabled=${verifier.enabled}.`,
      );
    }
    return verifier.enabled;
  }
  return overrideEnabled !== undefined ? overrideEnabled : verifier.enabled;
}