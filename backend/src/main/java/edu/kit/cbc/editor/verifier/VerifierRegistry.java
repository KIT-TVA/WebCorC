package edu.kit.cbc.editor.verifier;

import io.micronaut.context.env.PropertySourcePropertyResolver;
import io.micronaut.core.naming.conventions.StringConvention;
import io.micronaut.core.order.OrderUtil;
import io.micronaut.core.value.PropertyResolver;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * The Verifier Registry: the deployment's configuration naming each Verifier by id and URL,
 * in the operator's order, plus the optional policy each entry may carry (see
 * {@link VerifierRegistryEntry}). Bound from the {@code verifiers} list; the application default
 * is an empty list, so a deployment with no Registry file mounted has no registered Verifiers and
 * the Catalog holds only the Functional Verifier.
 *
 * <p>Answers "which Verifiers exist, in what order" ({@link #ids()}) and "URL and policy for
 * id" ({@link #entry(String)}). Inside the backend a Verifier is addressed by id; only the
 * {@link VerifierClient} turns an id into a URL.
 *
 * <p>The Functional Verifier is built in, not registered: its id
 * ({@link VerifierCatalogService#FUNCTIONAL_VERIFIER_ID}) is reserved.
 *
 * <p>Malformed entries — missing id or URL, duplicate ids, the reserved id, or a field the
 * Registry does not recognise (a typo in a policy field's name) — fail at startup rather than
 * being dropped silently, so an operator's mistake surfaces immediately.
 */
@Singleton
public class VerifierRegistry {

    private final List<VerifierRegistryEntry> entries;

    /**
     * Convenience constructor for code that builds entries directly (tests): the unknown-field
     * check runs against an empty configuration source, so it always passes vacuously — there
     * is no raw configuration to compare the entries against.
     */
    public VerifierRegistry(List<VerifierRegistryEntry> entries) {
        this(entries, new PropertySourcePropertyResolver());
    }

    @Inject
    public VerifierRegistry(List<VerifierRegistryEntry> entries, PropertyResolver properties) {
        this.entries = List.copyOf(entries.stream().sorted(OrderUtil.COMPARATOR).toList());
        validate(this.entries, properties);
    }

    /** Every registered Verifier in Registry (configuration) order. Immutable. */
    public List<VerifierRegistryEntry> entries() {
        return entries;
    }

    /** The ids of every registered Verifier in Registry (configuration) order. Immutable. */
    public List<String> ids() {
        return entries.stream().map(VerifierRegistryEntry::getId).toList();
    }

    /**
     * The Registry entry — URL and policy — of one Verifier.
     *
     * @param id a Verifier id
     * @return the entry, or empty if no Verifier is registered under {@code id}
     */
    public Optional<VerifierRegistryEntry> entry(String id) {
        return entries.stream().filter(entry -> entry.getId().equals(id)).findFirst();
    }

    private static void validate(List<VerifierRegistryEntry> entries, PropertyResolver properties) {
        Set<String> ids = new HashSet<>();
        for (VerifierRegistryEntry entry : entries) {
            String id = entry.getId();
            if (id == null || id.isBlank()) {
                throw new IllegalStateException(
                    "Verifier Registry entry #" + entry.getOrder() + " has no id");
            }
            if (entry.getUrl() == null || entry.getUrl().isBlank()) {
                throw new IllegalStateException(
                    "Verifier Registry entry '" + id + "' has no url");
            }
            if (VerifierCatalogService.FUNCTIONAL_VERIFIER_ID.equals(id)) {
                throw new IllegalStateException(
                    "Verifier Registry must not register '" + id + "': the Functional Verifier is built in");
            }
            if (!ids.add(id)) {
                throw new IllegalStateException(
                    "Verifier Registry lists id '" + id + "' more than once");
            }
            validateKnownFields(entry, properties);
        }
    }

    /**
     * Rejects a configuration field the entry's binding does not recognise — a typo in a policy
     * field's name (e.g. {@code lable} for {@code label}) would otherwise bind to nothing and be
     * silently dropped. Reads the entry's raw configuration back from {@code properties} because
     * {@link VerifierRegistryEntry}'s bound fields cannot themselves tell "absent" from
     * "misspelled".
     */
    private static void validateKnownFields(VerifierRegistryEntry entry, PropertyResolver properties) {
        String prefix = "verifiers[" + entry.getOrder() + "]";
        Map<String, Object> raw = properties.getProperties(prefix, StringConvention.RAW);
        for (String key : raw.keySet()) {
            int dot = key.indexOf('.');
            String field = dot < 0 ? key : key.substring(0, dot);
            if (!VerifierRegistryEntry.KNOWN_FIELDS.contains(field)) {
                throw new IllegalStateException("Verifier Registry entry '" + entry.getId()
                    + "' has an unknown field '" + field + "'; only id, url, label, enabled, toggleable "
                    + "and settings.<id>.default are recognised");
            }
            if ("settings".equals(field)) {
                validateSettingsField(entry, key, dot < 0 ? "" : key.substring(dot + 1));
            }
        }
    }

    /** Within {@code settings}, only {@code <settingId>.default} is a recognised path. */
    private static void validateSettingsField(VerifierRegistryEntry entry, String fullKey, String underSettings) {
        int settingDot = underSettings.indexOf('.');
        String overriddenField = settingDot < 0 ? "" : underSettings.substring(settingDot + 1);
        if (settingDot < 0 || !"default".equals(overriddenField)) {
            throw new IllegalStateException("Verifier Registry entry '" + entry.getId()
                + "' overrides '" + fullKey + "'; only settings.<id>.default is overridable "
                + "(not a setting's id, type, label, description or required)");
        }
    }
}
