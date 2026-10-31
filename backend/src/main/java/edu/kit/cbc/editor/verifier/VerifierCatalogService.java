package edu.kit.cbc.editor.verifier;

import io.micronaut.context.annotation.Context;
import io.micronaut.core.naming.NameUtils;
import io.micronaut.json.tree.JsonNode;
import io.micronaut.scheduling.TaskExecutors;
import jakarta.inject.Named;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Executor;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * Builds the Verifier Catalog once at application startup and serves it from an immutable
 * cache for the backend's lifetime — no refresh, no liveness checks per request. A Verifier
 * that comes back online is picked up only on backend restart.
 *
 * <p>The build starts when the application context creates this bean, but runs on the blocking
 * task executor rather than on the startup thread: the retries for an unreachable Verifier can
 * take a while (retries × retry delay, per Verifier), and the HTTP server binds its port only
 * once the context has started, so building inline would keep the whole backend unreachable
 * until the slowest Verifier gave up. {@link #catalog()} is therefore a {@link CompletionStage}
 * — a request for the Catalog arriving before the build is done is held and answered the moment
 * it completes; every later one is answered from the cache at once.
 *
 * <p>The Catalog is assembled by iterating the {@link VerifierRegistry} in order, fetching each
 * Verifier's {@link SelfDescription} through the {@link VerifierClient} (by id — this service
 * never sees a URL), validating it with the {@link SelfDescriptionValidator}, and merging it
 * into a Catalog entry via {@link #merge(String, SelfDescription)}. The Functional Verifier is
 * prepended through the very same merge step from the constant
 * {@link #FUNCTIONAL_SELF_DESCRIPTION}; moving it behind the Verifier API later means deleting
 * the constant and adding a Registry entry, nothing else.
 *
 * <p>A Verifier that is <em>unreachable</em> — still, after the retries of the
 * {@link VerifierCatalogConfiguration} — or whose Self-Description is <em>invalid</em> (does
 * not parse, or violates the schema; never retried) is not dropped but <strong>locked
 * off</strong>: it keeps its place in Registry order as
 * {@link #lockedOff(String, VerifierRegistryEntry)}, so the user's Verifier Overrides for it
 * survive, and the backend log carries a warning with the detailed reason. The Catalog then
 * carries one {@code message} naming every unavailable Verifier and why, for the frontend
 * console.
 *
 * <p>Once a Self-Description is validated, the Registry entry's policy is applied over it —
 * {@code label}, {@code enabled}, {@code toggleable} and any {@code settings.<id>.default} — by
 * {@link #applyPolicy(Verifier, VerifierRegistryEntry)}. A policy naming a setting id the
 * Verifier does not declare, or a default that does not fit the setting (its type, range, step
 * or options), is logged as a warning and otherwise ignored; conversely, a fitting policy default
 * stands in for a Verifier's own default that is missing or does not fit, with a warning instead
 * of the lock-off the validator would otherwise cause. A locked-off entry
 * only takes the policy's {@code label} (over the {@code "<id> (offline)"} fallback); its
 * {@code enabled}/{@code toggleable} stay locked regardless of policy, and it has no settings to
 * override — a {@code settings} policy on it cannot be checked against the Verifier's declared
 * setting ids, which a second warning after the lock-off says, so a typo does not stay silent
 * until the next restart with the Verifier up.
 */
@Context
public class VerifierCatalogService {

    /** Id of the built-in Functional Verifier; always first in the Catalog, always enabled. */
    public static final String FUNCTIONAL_VERIFIER_ID = "func";

    /**
     * The Functional Verifier's Self-Description: locked on ({@code enabled: true},
     * {@code toggleable: false}), no settings, no variables, no status placeholder.
     *
     * <p>Mirrored by hand in the frontend's {@code VerifierService.FUNCTIONAL_VERIFIER_FALLBACK}
     * (shown before the Catalog arrives or when its fetch fails); change both together.
     */
    public static final SelfDescription FUNCTIONAL_SELF_DESCRIPTION = new SelfDescription(
        "Functional correctness",
        true,
        false,
        null,
        List.of(),
        List.of(),
        null
    );

    private static final Logger LOGGER = Logger.getGlobal();

    private final CompletableFuture<VerifierCatalog> catalog;

    public VerifierCatalogService(
        VerifierRegistry registry,
        VerifierClient client,
        VerifierCatalogConfiguration configuration,
        @Named(TaskExecutors.BLOCKING) Executor executor
    ) {
        this.catalog = CompletableFuture.supplyAsync(() -> build(registry, client, configuration), executor);
    }

    /**
     * The cached Verifier Catalog: a stage that completes once the startup build is done and
     * yields the same instance on every call. It never completes exceptionally — an unavailable
     * Verifier is locked off inside the Catalog, not raised.
     */
    public CompletionStage<VerifierCatalog> catalog() {
        return catalog;
    }

    /**
     * The merge step every Catalog entry passes through: the Registry-assigned id joined with
     * the Verifier's Self-Description. Settings and variables the Verifier omitted become
     * empty lists, since the Catalog always carries the arrays. Registry policy is not applied
     * yet.
     *
     * @param id the id the Verifier Registry assigns to the Verifier
     * @param description what the Verifier declares about itself; a fetched one has passed
     *     {@link SelfDescriptionValidator#validate}, so its {@code enabled} is present
     * @return the Catalog entry
     */
    static Verifier merge(String id, SelfDescription description) {
        return new Verifier(
            id,
            description.label(),
            description.enabled(),
            description.toggleable(),
            description.statusPlaceholder(),
            description.settings() == null ? List.of() : List.copyOf(description.settings()),
            description.variables() == null ? List.of() : List.copyOf(description.variables()),
            description.allowFunctionalVariables()
        );
    }

    /**
     * The locked-off entry of a Verifier that is unavailable at startup: {@code enabled: false},
     * {@code toggleable: false}, no settings, no variables, no status placeholder. The label is
     * the fallback {@code "<id> (offline)"}, unless {@code policy} overrides it — the one policy
     * field a locked-off entry still honours; {@code enabled}/{@code toggleable} stay locked
     * regardless of policy. Goes through the same merge step as every other entry, so it is
     * shaped exactly like one.
     *
     * @param id the Verifier's Registry id
     * @param policy the Registry entry, for its {@code label} override, or {@code null}
     * @return the Catalog entry
     */
    static Verifier lockedOff(String id, VerifierRegistryEntry policy) {
        String label = policy != null && policy.getLabel() != null ? policy.getLabel() : id + " (offline)";
        return merge(id, new SelfDescription(label, false, false, null, List.of(), List.of(), null));
    }

    /**
     * Applies a Registry entry's policy over an already-merged Catalog entry: {@code label},
     * {@code enabled} and {@code toggleable} are replaced where the policy sets them, and every
     * setting the policy names a {@code default} for is replaced accordingly. A policy field left
     * unset ({@code null}, or a setting id absent from {@code settings}) keeps the Verifier's own
     * value. Not used for locked-off entries — see {@link #lockedOff(String, VerifierRegistryEntry)}.
     *
     * @param verifier the plain merge of id and Self-Description
     * @param policy the Registry entry the Verifier is registered under
     * @return the Catalog entry with policy applied
     */
    static Verifier applyPolicy(Verifier verifier, VerifierRegistryEntry policy) {
        return new Verifier(
            verifier.id(),
            policy.getLabel() != null ? policy.getLabel() : verifier.label(),
            policy.getEnabled() != null ? policy.getEnabled() : verifier.enabled(),
            policy.getToggleable() != null ? policy.getToggleable() : verifier.toggleable(),
            verifier.statusPlaceholder(),
            applySettingDefaults(verifier.id(), verifier.settings(), policy),
            verifier.variables(),
            verifier.allowFunctionalVariables()
        );
    }

    /**
     * Replaces the {@code default} of every setting {@code policy} names one for; a policy
     * {@code settings.<id>.default} for a setting id the Verifier does not declare is logged as a
     * warning and ignored, and so is one whose value does not fit the setting (per
     * {@link SelfDescriptionValidator#defaultViolation}, the same rules the Verifier's own default
     * had to pass — e.g. an unquoted {@code default: 75} on a text setting, which the Registry
     * binds as a number, or a value outside the setting's range) — the Verifier's own default is
     * then kept. "Declares" is checked in
     * hyphenated form (see {@link VerifierRegistryEntry#getSettings()}), since Micronaut may have
     * hyphenated the policy's own camelCase setting id.
     */
    private static List<VerifierSetting> applySettingDefaults(
        String id, List<VerifierSetting> settings, VerifierRegistryEntry policy
    ) {
        if (policy.getSettings().isEmpty()) {
            return settings;
        }
        Set<String> knownHyphenatedIds = settings.stream()
            .map(setting -> NameUtils.hyphenate(setting.id(), true))
            .collect(Collectors.toSet());
        for (String settingId : policy.policedSettingIds()) {
            if (!knownHyphenatedIds.contains(NameUtils.hyphenate(settingId, true))) {
                LOGGER.warning(String.format(
                    "Verifier Registry policy for '%s' overrides unknown setting id '%s'; ignored", id, settingId));
            }
        }
        return settings.stream()
            .map(setting -> policy.settingDefault(setting.id())
                .filter(override -> fitsSetting(id, setting, override))
                .map(setting::withDefault)
                .orElse(setting))
            .toList();
    }

    /** Whether a policy default fits the setting; logs the warning when it does not. */
    private static boolean fitsSetting(String id, VerifierSetting setting, JsonNode override) {
        Optional<String> violation = SelfDescriptionValidator.defaultViolation(setting, override);
        violation.ifPresent(reason -> LOGGER.warning(String.format(
            "Verifier Registry policy for '%s' overrides setting '%s' with a default that is %s; ignored, "
                + "the Verifier's own default is kept", id, setting.id(), reason)));
        return violation.isEmpty();
    }

    /** Why a Verifier is unavailable, in the words of the Catalog {@code message}. */
    private enum Unavailability {
        UNREACHABLE("unreachable"),
        INVALID_DESCRIPTION("invalid description");

        private final String wording;

        Unavailability(String wording) {
            this.wording = wording;
        }
    }

    /** One locked-off Verifier and why. */
    private record Unavailable(String id, Unavailability why) {}

    private static VerifierCatalog build(
        VerifierRegistry registry,
        VerifierClient client,
        VerifierCatalogConfiguration configuration
    ) {
        List<Verifier> verifiers = new ArrayList<>();
        List<Unavailable> unavailable = new ArrayList<>();
        verifiers.add(merge(FUNCTIONAL_VERIFIER_ID, FUNCTIONAL_SELF_DESCRIPTION));
        for (VerifierRegistryEntry entry : registry.entries()) {
            String id = entry.getId();
            try {
                SelfDescription description = describeWithRetry(id, client, configuration);
                for (String flaw : SelfDescriptionValidator.validate(id, description, entry::settingDefault)) {
                    LOGGER.warning(String.format("Verifier '%s' declares an unusable default; "
                        + "the Verifier Registry policy override is applied instead: %s", id, flaw));
                }
                verifiers.add(applyPolicy(merge(id, description), entry));
                LOGGER.info(String.format("Verifier '%s' described itself and joins the Verifier Catalog", id));
            } catch (VerifierUnreachableException e) {
                lockOff(verifiers, unavailable, id, Unavailability.UNREACHABLE, e, entry);
            } catch (InvalidVerifierResponseException e) {
                lockOff(verifiers, unavailable, id, Unavailability.INVALID_DESCRIPTION, e, entry);
            }
        }
        LOGGER.info(String.format("Verifier Catalog built with %d entries, %d locked off",
            verifiers.size(), unavailable.size()));
        return new VerifierCatalog(verifiers, message(unavailable));
    }

    /**
     * Asks the Verifier for its Self-Description, retrying as configured while it is
     * <em>unreachable</em>. An <em>invalid</em> answer is returned to the caller immediately.
     */
    private static SelfDescription describeWithRetry(
        String id,
        VerifierClient client,
        VerifierCatalogConfiguration configuration
    ) throws VerifierUnreachableException, InvalidVerifierResponseException {
        int attempts = configuration.getRetries() + 1;
        for (int attempt = 1; ; attempt++) {
            try {
                return client.describe(id);
            } catch (VerifierUnreachableException e) {
                if (attempt >= attempts) {
                    throw new VerifierUnreachableException(
                        "no answer in " + plural(attempts, "attempt") + ": " + e.getMessage(), e);
                }
                LOGGER.info(String.format("Verifier '%s' unreachable (attempt %d of %d), retrying in %d ms: %s",
                    id, attempt, attempts, configuration.getRetryDelay().toMillis(), e.getMessage()));
                if (!pause(configuration.getRetryDelay())) {
                    throw new VerifierUnreachableException(
                        "startup interrupted after " + plural(attempt, "attempt") + ": " + e.getMessage(), e);
                }
            }
        }
    }

    /** Sleeps for {@code delay}; {@code false} if interrupted meanwhile (the flag is restored). */
    private static boolean pause(Duration delay) {
        if (delay.isZero()) {
            return true;
        }
        try {
            Thread.sleep(delay.toMillis());
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private static String plural(int count, String noun) {
        return count + " " + noun + (count == 1 ? "" : "s");
    }

    private static void lockOff(
        List<Verifier> verifiers,
        List<Unavailable> unavailable,
        String id,
        Unavailability why,
        VerifierClientException cause,
        VerifierRegistryEntry entry
    ) {
        verifiers.add(lockedOff(id, entry));
        unavailable.add(new Unavailable(id, why));
        LOGGER.warning(String.format("Verifier '%s' is locked off in the Verifier Catalog (%s): %s",
            id, why.wording, cause.getMessage()));
        if (!entry.getSettings().isEmpty()) {
            LOGGER.warning(String.format(
                "Verifier Registry policy for '%s' names settings %s; not verified because the Verifier is locked off",
                id, entry.policedSettingIds().stream().sorted().toList()));
        }
    }

    /**
     * The console line for the frontend, e.g. {@code "2 verifiers unavailable: eebc (unreachable),
     * sec (invalid description)"}; {@code null} when every Verifier loaded.
     */
    private static String message(List<Unavailable> unavailable) {
        if (unavailable.isEmpty()) {
            return null;
        }
        return plural(unavailable.size(), "verifier") + " unavailable: "
            + unavailable.stream()
                .map(entry -> entry.id() + " (" + entry.why().wording + ")")
                .collect(Collectors.joining(", "));
    }
}
