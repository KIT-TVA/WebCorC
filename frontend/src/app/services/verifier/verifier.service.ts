import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, Signal, WritableSignal, computed, signal, inject } from "@angular/core";
import { Observable, Subject, retry, throwError, timer } from "rxjs";
import {
  FUNCTIONAL_VERIFIER_ID,
  Verifier,
  VerifierCatalog,
  VerifierOverrides,
} from "../../types/Verifier";
import { ConsoleService } from "../console/console.service";
import { ProjectService } from "../project/project.service";
import { VerifierNetworkService } from "./network/verifier-network.service";
import { applyOverrides } from "./verifier-overrides";
import { hasStatus, isSettingValid, isWellFormedCatalog } from "./verifier-validation";

/** How the Verifier Catalog fetch is going; see {@link VerifierService.catalogFetch}. */
export type CatalogFetchState =
  | { status: "fetching"; attempt: number }
  | { status: "loaded" }
  | { status: "failed" };

/**
 * What kind of user-driven override change {@link VerifierService.overridesChanged} just
 * fired for: `enabled` from {@link VerifierService.setEnabled}, `setting` from
 * {@link VerifierService.updateSetting}. `id` is the affected Verifier's id.
 */
export type OverrideChange = { kind: "enabled" | "setting"; id: string };

/**
 * State is split into a read-only Catalog ({@link _catalog}, fetched once at construction and
 * held in memory only — never sessionStorage, so a reload shows the deployment's current
 * Catalog) and sparse {@link _overrides} for user edits. {@link verifiers} merges the two.
 */
@Injectable({
  providedIn: "root",
})
export class VerifierService {
  private projectService = inject(ProjectService);
  private network = inject(VerifierNetworkService);
  private consoleService = inject(ConsoleService);

  /**
   * Local mirror of the backend's Functional Verifier entry, so the invariant "every Catalog contains `func`, locked on" holds even before a Catalog has been fetched.
   * Hand-copied from `FUNCTIONAL_SELF_DESCRIPTION` in the backend's `VerifierCatalogService`; change both together.
   */
  private static readonly FUNCTIONAL_VERIFIER_FALLBACK: Verifier = {
    id: FUNCTIONAL_VERIFIER_ID,
    label: "Functional correctness",
    enabled: true,
    toggleable: false,
    settings: [],
    variables: [],
  };

  /** Retry budget for the Catalog fetch — the dev stack's backend can take ~1 minute to bind its port on a cold start. */
  public static readonly CATALOG_FETCH_ATTEMPTS = 40;
  public static readonly CATALOG_FETCH_DELAY_MS = 3000;

  /** HTTP statuses meaning "nobody answered" (connection failure, or a proxy that can't reach the backend) — only these are retried. */
  private static readonly UNREACHABLE_STATUSES: ReadonlySet<number> = new Set([0, 502, 503, 504]);

  private _catalog: WritableSignal<Verifier[]> = signal([VerifierService.FUNCTIONAL_VERIFIER_FALLBACK]);
  private _overrides: WritableSignal<VerifierOverrides> = signal({});
  private _catalogFetch: WritableSignal<CatalogFetchState> = signal({ status: "fetching", attempt: 1 });

  /**
   * How the Catalog fetch is going, for the Verifiers panel to say so while the backend is not
   * up yet: `fetching` with the 1-based attempt currently in flight (of
   * {@link CATALOG_FETCH_ATTEMPTS}), `loaded` once the Catalog is shown, `failed` once the
   * fetch has been given up on and only the Functional Verifier remains.
   */
  public readonly catalogFetch: Signal<CatalogFetchState> = this._catalogFetch.asReadonly();

  constructor() {
    this.fetchCatalog();
    const cached = this.projectService.getVerifierOverrides();
    if (cached) {
      this._overrides.set(cached);
    }
    this.projectService.verifierOverridesLoaded.subscribe(() => {
      const reloaded = this.projectService.getVerifierOverrides();
      if (reloaded) {
        this._overrides.set(reloaded);
      }
    });
  }

  /**
   * Read-only signal of the available verifiers, shared across all consuming components.
   * Recomputed automatically when either the Catalog or the overrides change.
   */
  public readonly verifiers: Signal<Verifier[]> = computed(() =>
    applyOverrides(this._catalog(), this._overrides()),
  );

  /** Whether every enabled verifier's settings are valid ({@link isSettingValid}); gates a future "run verification" action. */
  public readonly verifiersValid: Signal<boolean> = computed(() =>
    this.verifiers()
      .filter((verifier) => verifier.enabled)
      .every((verifier) => verifier.settings.every(isSettingValid)),
  );

  /**
   * Fetches the Catalog once, at construction — frozen for the backend's lifetime, refreshed
   * only by a page reload. A malformed body ({@link isWellFormedCatalog}) or non-retryable
   * error falls back to the Functional Verifier without retrying a request that wouldn't
   * produce a different shape.
   */
  private fetchCatalog(): void {
    this.network
      .fetchCatalog()
      .pipe(
        retry({
          count: VerifierService.CATALOG_FETCH_ATTEMPTS - 1,
          delay: (error: HttpErrorResponse, retryCount: number) => {
            if (!VerifierService.UNREACHABLE_STATUSES.has(error.status)) {
              return throwError(() => error);
            }
            this._catalogFetch.set({ status: "fetching", attempt: retryCount + 1 });
            return timer(VerifierService.CATALOG_FETCH_DELAY_MS);
          },
        }),
      )
      .subscribe({
        next: (catalog: VerifierCatalog) => {
          if (!isWellFormedCatalog(catalog)) {
            this.fallBackToFunctionalVerifier(
              "Verifier Catalog was malformed; showing only the Functional Verifier",
              "A Verifier entry was missing its settings/variables arrays",
            );
            return;
          }
          this._catalog.set(this.sortVerifiers(catalog.verifiers));
          this._catalogFetch.set({ status: "loaded" });
          if (catalog.message) {
            this.consoleService.addStringInfo(catalog.message, "pi pi-exclamation-triangle");
          }
        },
        error: (error: HttpErrorResponse) => {
          this.fallBackToFunctionalVerifier(
            "Verifier Catalog could not be fetched; showing only the Functional Verifier",
            error,
          );
        },
      });
  }

  /** Resets to the Functional Verifier and logs the failure — shared by an outright fetch failure and a malformed body. */
  private fallBackToFunctionalVerifier(action: string, error: HttpErrorResponse | string): void {
    this._catalog.set([VerifierService.FUNCTIONAL_VERIFIER_FALLBACK]);
    this._catalogFetch.set({ status: "failed" });
    if (typeof error === "string") {
      this.consoleService.addStringError(error, action);
    } else {
      this.consoleService.addErrorResponse(error, action);
    }
  }

  /**
   * Whether verification runs only the default functional verification instead of all
   * enabled verifiers. Selected via the global verify split button and applied to both
   * the global verify and per-statement verify. Session state only — not persisted with
   * the overrides.
   */
  private _functionalOnly: WritableSignal<boolean> = signal(false);
  public readonly functionalOnly: Signal<boolean> =
    this._functionalOnly.asReadonly();

  /**
   * Select between functional-only and all-verifiers verification.
   * @param functionalOnly When true, only the default functional verification runs
   */
  public setFunctionalOnly(functionalOnly: boolean): void {
    this._functionalOnly.set(functionalOnly);
  }

  public setEnabled(id: string, enabled: boolean): void {
    this._overrides.update((overrides) => {
      const existing = overrides[id] ?? { settings: {} };
      return { ...overrides, [id]: { ...existing, enabled } };
    });
    this.persist();
    this._overridesChanged.next({ kind: "enabled", id });
  }

  /**
   * Routes setting-input updates through the service so every consumer (side menu, bottom
   * menu) observes the same value. `input` is a string for text/select settings, a boolean
   * for boolean settings. Stamps the Override, which makes every earlier result of this
   * Verifier stale; a no-op when `input` is the setting's current value (Catalog default
   * included), so a control re-reporting its value cannot stale anything.
   */
  public updateSetting(
    verifierId: string,
    settingId: string,
    input: string | boolean,
  ): void {
    const current = this.verifiers()
      .find((verifier) => verifier.id === verifierId)
      ?.settings.find((setting) => setting.id === settingId)?.input;
    if (current === input) {
      return;
    }
    this._overrides.update((overrides) => {
      const existing = overrides[verifierId] ?? { settings: {} };
      return {
        ...overrides,
        [verifierId]: {
          ...existing,
          settings: { ...existing.settings, [settingId]: input },
          settingsUpdatedAt: Date.now(),
        },
      };
    });
    this.persist();
    this._overridesChanged.next({ kind: "setting", id: verifierId });
  }

  public settingsStamp(verifierId: string): number | undefined {
    return this._overrides()[verifierId]?.settingsUpdatedAt;
  }

  /** Fires after a user-driven override change (setEnabled/updateSetting) — not on initial hydration, so consumers can tell the two apart. */
  private readonly _overridesChanged = new Subject<OverrideChange>();
  public readonly overridesChanged: Observable<OverrideChange> =
    this._overridesChanged.asObservable();

  /** Persists overrides via {@link ProjectService} (sessionStorage cache + `.internal/verifiers.json`). */
  private persist(): void {
    this.projectService.saveVerifierOverrides(this._overrides());
  }

  /** Ranks Verifiers with more surfaced info (variables, status text, settings) higher, functional first. */
  private sortVerifiers(verifiers: Verifier[]): Verifier[] {
    const rank = (verifier: Verifier): number => {
      if (verifier.id === FUNCTIONAL_VERIFIER_ID) return 0;
      const hasVariables = verifier.variables.length > 0;
      const hasText = hasStatus(verifier);
      const hasSettings = verifier.settings.length > 0;
      if (hasVariables && hasText) return 1;
      if (hasVariables) return 2;
      if (hasText && hasSettings) return 3;
      if (hasSettings) return 4;
      if (hasText) return 5;
      return 6;
    };
    return [...verifiers].sort((a, b) => rank(a) - rank(b));
  }

  /**
   * Get the list of enabled verifiers.
   */
  public get activeVerifiers(): Verifier[] {
    return this.verifiers().filter((verifier) => verifier.enabled);
  }

  public get activeVerifierIds(): string[] {
    return this.activeVerifiers.map((verifier) => verifier.id);
  }

  /**
   * Enabled Verifiers excluding the Functional Verifier — the enabled set {@link nodeStateFor}
   * derives a node's state over. Unlike {@link activeVerifierIds}, which includes the
   * Functional Verifier, this is what that function expects as its `enabledVerifiers`
   * argument.
   */
  public get enabledNonFunctionalVerifierIds(): string[] {
    return this.activeVerifiers
      .filter((verifier) => verifier.id !== FUNCTIONAL_VERIFIER_ID)
      .map((verifier) => verifier.id);
  }

  /**
   * The enabled set {@link nodeStateFor} should actually be derived over right now: `[]` when
   * the "Verify Functional" display mode is selected (a Verifier that is live-enabled but
   * not part of the current mode should not make an already-landed result look stale), else
   * {@link enabledNonFunctionalVerifierIds}. Node state reacts to the mode the user is
   * looking at, not the mode a past run happened to use.
   */
  public get effectiveEnabledNonFunctionalVerifierIds(): string[] {
    return this.functionalOnly() ? [] : this.enabledNonFunctionalVerifierIds;
  }

  /** Enabled verifiers with invalid settings, each narrowed to just the invalid ones — mirrors the {@link verifiersValid} gate. */
  public get invalidVerifierSettings(): Verifier[] {
    return this.verifiers()
      .filter((verifier) => verifier.enabled)
      .map((verifier) => ({
        ...verifier,
        settings: verifier.settings.filter(
          (setting) => !isSettingValid(setting),
        ),
      }))
      .filter((verifier) => verifier.settings.length > 0);
  }
}