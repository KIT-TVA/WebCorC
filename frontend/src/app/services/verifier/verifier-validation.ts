import { Verifier, VerifierCatalog, VerifierSetting } from "../../types/Verifier";

/** Tolerance for floating-point step-grid comparisons (e.g. 0.1 + 0.2 drift). */
const STEP_EPSILON = 1e-9;

export function effectiveStep(setting: { step?: number }): number {
  return setting.step ?? 1;
}

/**
 * Whether `value` sits on the step grid anchored at `base`, within a small floating-point
 * tolerance. Mirrors native `<input type="number">` step semantics, where the grid is
 * anchored at `range.min` (or `0` when there is no min).
 */
export function matchesStep(value: number, step: number, base: number): boolean {
  if (step <= 0) {
    return true;
  }
  const steps = (value - base) / step;
  return Math.abs(steps - Math.round(steps)) < STEP_EPSILON;
}

/** Mirrors the backend's `NumberRule` grammar, stricter than JS `Number()`. */
const NUMBER_GRAMMAR = /^-?\d+(\.\d+)?$/;

/** Only `""` is empty for a number Setting; whitespace-only input is a grammar error. */
export function isNumberSettingEmpty(input: string): boolean {
  return input.length === 0;
}

/**
 * Validates a numeric input string against a number setting's constraints (grammar, inclusive
 * range, step grid); returns the machine-readable error key, or `null` when valid. Shared by
 * the service gate and the step validator directive, so both agree on what "valid" means.
 *
 * `required` and emptiness are intentionally not handled here (see {@link isNumberSettingEmpty}
 * and the caller): empty optional inputs are valid and are filtered out by the caller.
 */
export function numberInputError(
  setting: Extract<VerifierSetting, { valueType: 'number' }>,
  input: string,
): 'number' | 'min' | 'max' | 'step' | null {
  if (!NUMBER_GRAMMAR.test(input)) {
    return 'number';
  }
  const value = Number(input);
  const min = setting.range?.min;
  const max = setting.range?.max;
  if (min !== undefined && value < min) {
    return 'min';
  }
  if (max !== undefined && value > max) {
    return 'max';
  }
  if (!matchesStep(value, effectiveStep(setting), min ?? 0)) {
    return 'step';
  }
  return null;
}

/**
 * Whether a fetched Catalog matches the contract every consumer relies on unchecked: each
 * entry's `settings`/`variables` as arrays (the backend always sends them, per the Catalog's
 * own invariant — their absence here means a frontend/backend version mismatch).
 * {@link applyOverrides} and the Catalog's sorting index into both fields unconditionally, so
 * a body that fails this check must be rejected before either runs.
 */
export function isWellFormedCatalog(catalog: VerifierCatalog): boolean {
  return (
    Array.isArray(catalog?.verifiers) &&
    catalog.verifiers.every(
      (verifier: Verifier) => Array.isArray(verifier?.settings) && Array.isArray(verifier?.variables),
    )
  );
}

/**
 * Whether a Verifier has status text worth surfacing; `statusPlaceholder` may be `undefined`
 * (no status declared) or `""` (e.g. cleared by an override) — both count as "no status".
 * Shared by {@link VerifierService.sortVerifiers} and the statement popup's accordion filter,
 * so both treat `statusPlaceholder=""` the same way.
 */
export function hasStatus(verifier: { statusPlaceholder?: string }): boolean {
  return !!verifier.statusPlaceholder;
}

/**
 * Whether a setting is valid for the purpose of gating a run; see
 * {@link VerifierService.verifiersValid}.
 */
export function isSettingValid(setting: VerifierSetting): boolean {
  if (setting.savedValueError) {
    return false;
  }
  if (setting.type === 'boolean') {
    return true;
  }
  const input = setting.input ?? '';
  const isNumber = setting.type === 'text' && setting.valueType === 'number';
  const empty = isNumber ? isNumberSettingEmpty(input) : input.trim().length === 0;
  if (setting.required && empty) {
    return false;
  }
  if (empty) {
    return true;
  }
  if (isNumber) {
    return numberInputError(setting, input) === null;
  }
  return true;
}