import { Directive, Input } from "@angular/core";
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from "@angular/forms";
import { VerifierSetting } from "../../types/Verifier";

/**
 * Surfaces a setting's `savedValueError` marker as a control error, so `mat-error` shows it
 * untouched. Reads the marker, not `control.value`.
 */
@Directive({
  selector: "[appSavedValueError]",
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: SavedValueErrorValidatorDirective, multi: true }],
})
export class SavedValueErrorValidatorDirective implements Validator {
  @Input({ alias: "appSavedValueError", required: true })
  public setting!: VerifierSetting;

  public validate(_control: AbstractControl): ValidationErrors | null {
    return this.setting.savedValueError ? { savedValueError: true } : null;
  }
}
