import { Component, Signal, inject } from "@angular/core";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from "primeng/accordion";
import { ToggleSwitch } from "primeng/toggleswitch";
import { FormsModule } from "@angular/forms";
import {
  MatError,
  MatFormField,
  MatHint,
  MatInput,
  MatLabel,
  MatSuffix,
} from "@angular/material/input";
import { MatOption, MatSelect } from "@angular/material/select";
import { Verifier, VerifierSetting } from "../../../types/Verifier";
import {
  CatalogFetchState,
  VerifierService,
} from "../../../services/verifier/verifier.service";
import { NumberInputValidatorDirective } from "../../../services/verifier/number-input-validator.directive";
import { SavedValueErrorValidatorDirective } from "../../../services/verifier/saved-value-error-validator.directive";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIconButton } from "@angular/material/button";
import { ErrorStateMatcher } from "@angular/material/core";
import { TreeService } from "../../../services/tree/tree.service";
import { verifierResultClass } from "../../../types/statements/abstract-statement";

/**
 * Show a `mat-error` as soon as the control is invalid, without waiting for it to be `touched`
 * or a form to be submitted (Material's default).
 */
const immediateErrorStateMatcher: ErrorStateMatcher = {
  isErrorState: (control) => !!control && control.invalid,
};

@Component({
  selector: "app-verifier-manager",
  imports: [
    Accordion,
    AccordionContent,
    AccordionHeader,
    AccordionPanel,
    ToggleSwitch,
    FormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatSelect,
    MatOption,
    NumberInputValidatorDirective,
    SavedValueErrorValidatorDirective,
    MatHint,
    MatTooltip,
    MatSuffix,
    MatIconButton,
  ],
  templateUrl: "./verifier-manager.component.html",
  standalone: true,
  styleUrl: "./verifier-manager.component.css",
  providers: [
    { provide: ErrorStateMatcher, useValue: immediateErrorStateMatcher },
  ],
})
/**
 * Component, to manage the available verifiers, each verifier can be enabled or disabled via a toggle and,
 * when it has settings, configured through an expandable accordion section.
 * The verifier list and all of its state (enabled flag, settings input values) live in the shared
 * {@link VerifierService} signal, so the side menu and bottom menu placements stay in sync. Settings inputs
 * bind one-way and route every change back through the service, mirroring the condition editor.
 * @link https://primeng.org/accordion
 */
export class VerifierManagerComponent {
  private verifierService = inject(VerifierService);
  private treeService = inject(TreeService);

  private _expandedSections: string[] = [];

  /**
   * How the Catalog fetch is going, for the status line above the list: shown while the
   * service is still (re)trying, so a page opened before the backend is up says why the list
   * is short instead of silently showing only the Functional Verifier.
   */
  public readonly catalogFetch: Signal<CatalogFetchState> = this.verifierService.catalogFetch;
  public readonly maxFetchAttempts = VerifierService.CATALOG_FETCH_ATTEMPTS;

  /**
   * Handle the toggle of a verifier. Updates the shared enabled state through the service.
   * Auto-collapses the section on disable and auto-expands it on enable (only for verifiers
   * with settings); the user can then manually re-open a disabled section or close an
   * enabled one via the chevron.
   * @param item The toggled verifier
   * @param enabled The new enabled state from the toggle
   */
  public onToggle(item: Verifier, enabled: boolean) {
    this.verifierService.setEnabled(item.id, enabled);
    if (!enabled) {
      // collapse when switched off
      this._expandedSections = this._expandedSections.filter(
        (v) => v !== item.id,
      );
    } else if (this.hasBody(item.id)) {
      this._expandedSections = [...this._expandedSections, item.id];
    }
  }

  /**
   * Persist a settings input change to the shared service, keeping it the single source of
   * truth across every consuming component. Text, numeric and select inputs bind as plain
   * strings — numeric settings render as `type="text"` so non-numeric text survives to be
   * validated rather than being swallowed by a native number input; `null`/`undefined` is
   * coerced to `''`, so emptiness is always `''`. Boolean toggles report a real boolean that
   * is passed through untouched — a toggle cannot produce an invalid value, so there is
   * nothing to round-trip. Invalid string values are persisted on purpose: the field flags
   * them via `mat-error` and the service's `verifiersValid` gate blocks their use, so the
   * model never lies about its view.
   * @param item The verifier owning the setting
   * @param setting The setting that changed
   * @param value The new input value as reported by the bound control
   */
  public onSettingChange(
    item: Verifier,
    setting: VerifierSetting,
    value: string | number | boolean | null,
  ) {
    this.verifierService.updateSetting(
      item.id,
      setting.id,
      typeof value === "boolean" ? value : value == null ? "" : String(value),
    );
  }

  /**
   * Update the set of expanded accordion sections, keeping only verifiers that are enabled and have settings.
   * A disabled or settings-less section can never be opened, so it never stays in the active set.
   * @param expandedSections The currently expanded section values as reported by the accordion
   */
  public updateExpandedSections(
    expandedSections: string | number | string[] | number[] | null | undefined,
  ) {
    const sections = Array.isArray(expandedSections)
      ? expandedSections.map(String)
      : [];
    // a disabled or bodyless Section can never be opened, so it never stays in the active set
    this._expandedSections = sections.filter(
      (section) => this.isEnabled(section) && this.hasBody(section),
    );
  }

  /**
   * Check whether the verifier with the given id is enabled.
   * @param id The id of the verifier to check
   */
  private isEnabled(id: string): boolean {
    return (
      this.verifierService.verifiers().find((item) => item.id === id)
        ?.enabled ?? false
    );
  }

  /**
   * Return the description of a setting field, or `undefined` when none is set.
   * Exposed as a component method so the template calls `getDescription(field)`
   * instead of reaching into `field.description` directly — a single seam for
   * future fallbacks (e.g., i18n lookup, defaulting to the label).
   * @param field The setting to read the description from
   */
  public getDescription(field: VerifierSetting): string | undefined {
    const description = field.description;
    // `false` is a real boolean default and must still be shown; only undefined and the
    // empty string mean "no default"
    const defaultValue =
      field.default === undefined || field.default === ""
        ? undefined
        : field.type === "select"
          ? (field.options.find((option) => option.id === field.default)
              ?.label ?? String(field.default))
          : String(field.default);
    if (description && defaultValue) {
      return description + " (default: " + defaultValue + ")";
    } else if (description) {
      return description;
    } else if (defaultValue) {
      return "Default: " + defaultValue;
    } else {
      return undefined;
    }
  }

  /** The saved id behind an `'unknown-option'` marker, for the error text. */
  public savedOptionId(field: Extract<VerifierSetting, { type: "select" }>): string {
    return String(field.savedValueError?.value ?? "");
  }

  /** Shows a marked (untrusted) saved value as off, never as the default. */
  public booleanToggleValue(
    field: Extract<VerifierSetting, { type: "boolean" }>,
  ): boolean {
    return field.savedValueError ? false : (field.input ?? field.default);
  }

  /**
   * Check whether the verifier with the given id has any body content to display,
   * i.e. at least one setting or at least one variable. Verifiers without a body
   * render as a static header (no accordion chevron, no expandable section).
   * @param id The id of the verifier to check
   */
  private hasBody(id: string): boolean {
    const verifier = this.verifierService
      .verifiers()
      .find((item) => item.id === id);
    return (
      (verifier?.settings.length ?? 0) > 0 ||
      (verifier?.variables.length ?? 0) > 0
    );
  }

  /** A Verifier's result on the open diagram's Root, i.e. the project result. */
  public rootResultClass(item: Verifier): string {
    const root = this.treeService.rootStatement?.statement;
    const result = root ? this.treeService.verifierResult(root, item.id) : "none";
    return verifierResultClass(result, !item.enabled);
  }

  /**
   * Getter for the verifiers, sourced from the shared service signal.
   */
  public get items(): Verifier[] {
    return this.verifierService.verifiers();
  }

  /**
   * Getter for the values of the currently expanded accordion sections
   */
  public get expandedSections(): string[] {
    return this._expandedSections;
  }
}
