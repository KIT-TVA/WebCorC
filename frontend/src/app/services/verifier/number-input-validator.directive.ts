import { Directive, Input } from "@angular/core";
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from "@angular/forms";
import { VerifierSetting } from "../../types/Verifier";
import { isNumberSettingEmpty, numberInputError } from "./verifier-validation";

/**
 * Validates a numeric verifier setting rendered as `<input type="text">` rather than
 * `type="number"`, whose DOM value silently goes empty for non-numeric text like `"abc"`,
 * losing the raw string before a "must be a number" error could ever be raised. Shares
 * {@link numberInputError} with the service's run gate so the two checks cannot drift.
 * Emptiness is left to Angular's built-in `required`, which this validator composes with.
 */
@Directive({
  selector: "[appNumberInput]",
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: NumberInputValidatorDirective, multi: true }],
})
export class NumberInputValidatorDirective implements Validator {
  /** The number setting whose constraints (range, step) are enforced. */
  @Input({ alias: "appNumberInput", required: true })
  public setting!: Extract<VerifierSetting, { valueType: "number" }>;

  /**
   * Empty values pass (`required` is handled elsewhere, and emptiness per
   * {@link isNumberSettingEmpty}); otherwise the {@link numberInputError} key, if any, is
   * surfaced as the control error so `mat-error` can react to it.
   */
  public validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || isNumberSettingEmpty(String(value))) {
      return null;
    }
    const error = numberInputError(this.setting, String(value));
    return error ? { [error]: true } : null;
  }
}
