package edu.kit.cbc.editor.verifier;

import io.micronaut.context.annotation.EachProperty;
import io.micronaut.context.annotation.Parameter;
import io.micronaut.core.naming.NameUtils;
import io.micronaut.core.order.Ordered;
import io.micronaut.json.tree.JsonNode;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * One entry of the Verifier Registry: a Verifier the deployment declares by {@code id} and
 * {@code url}, plus the deployment's optional policy on top of that Verifier's
 * {@link SelfDescription}, bound from the ordered list under {@code verifiers} in the backend
 * configuration (the deployment's Registry file, mounted via {@code MICRONAUT_CONFIG_FILES}).
 *
 * <p>The list index is the entry's {@linkplain #getOrder() order}, so the Registry presents
 * Verifiers in the order the operator listed them.
 *
 * <p>Policy is nothing but a deployment-side override of a few fields of the Self-Description:
 * {@code label}, {@code enabled}, {@code toggleable}, and the {@code default} of a Setting the
 * Verifier itself declares, addressed by its id under {@code settings}. A field left unset here
 * ({@code null}, or absent from {@code settings}) keeps the Verifier's own value; nothing else
 * — not a setting's {@code id}, {@code type}, {@code label}, {@code description} or
 * {@code required} — is overridable. {@link VerifierCatalogService} applies the policy over the
 * Self-Description during the Catalog merge; {@link VerifierRegistry} rejects a field in the
 * configuration that is neither one of these nor {@code id}/{@code url}, so a typo in the
 * Registry file fails loudly at startup instead of being silently dropped.
 */
@EachProperty(value = "verifiers", list = true)
public class VerifierRegistryEntry implements Ordered {

    /** The top-level fields a Registry entry may declare; anything else is a configuration error. */
    static final Set<String> KNOWN_FIELDS = Set.of("id", "url", "label", "enabled", "toggleable", "settings");

    private final int index;
    private String id;
    private String url;
    private String label;
    private Boolean enabled;
    private Boolean toggleable;
    private Map<String, Map<String, Object>> settings = Map.of();

    public VerifierRegistryEntry(@Parameter Integer index) {
        this.index = index;
    }

    @Override
    public int getOrder() {
        return index;
    }

    /** Stable identifier the backend addresses the Verifier by; assigned here, not by the Verifier. */
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    /** Base URL of the Verifier; the Verifier API paths are appended to it. */
    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    /** Overrides the Self-Description's label in the Catalog, or {@code null} to keep it. */
    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    /** Overrides the Self-Description's default enabled state, or {@code null} to keep it. */
    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    /** Overrides the Self-Description's default toggleability, or {@code null} to keep it. */
    public Boolean getToggleable() {
        return toggleable;
    }

    public void setToggleable(Boolean toggleable) {
        this.toggleable = toggleable;
    }

    /**
     * Per-setting policy, keyed by the Setting's id; each entry's only recognised key is
     * {@code default}. Raw ({@code Map<String, Object>}) because the Setting's own schema — not
     * the Registry — owns the value's type; {@link #settingDefault(String)} converts it.
     *
     * <p>Keys are hyphenated when Micronaut rebuilds the map from flat properties (e.g.
     * {@code @Property}) but exact from a YAML source, so compare them in hyphenated form.
     */
    public Map<String, Map<String, Object>> getSettings() {
        return settings;
    }

    public void setSettings(Map<String, Map<String, Object>> settings) {
        this.settings = settings == null ? Map.of() : settings;
    }

    /** The setting ids this entry has a policy for, for the "unknown setting id" check. */
    Set<String> policedSettingIds() {
        return settings.keySet();
    }

    /**
     * The policy default for one Setting, converted to the wire representation
     * {@link VerifierSetting#defaultValue()} uses. Matches {@code settingId} in hyphenated form
     * (see {@link #getSettings()}).
     *
     * @param settingId a Setting's id
     * @return the overriding default, or empty if this entry has no {@code settings.<id>.default}
     */
    public Optional<JsonNode> settingDefault(String settingId) {
        String hyphenated = NameUtils.hyphenate(settingId, true);
        Map<String, Object> policy = settings.entrySet().stream()
            .filter(entry -> NameUtils.hyphenate(entry.getKey(), true).equals(hyphenated))
            .map(Map.Entry::getValue)
            .findFirst()
            .orElse(null);
        if (policy == null) {
            return Optional.empty();
        }
        Object defaultValue = policy.get("default");
        return defaultValue == null ? Optional.empty() : Optional.of(JsonNode.from(defaultValue));
    }
}
