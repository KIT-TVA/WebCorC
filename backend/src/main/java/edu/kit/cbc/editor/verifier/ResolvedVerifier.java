package edu.kit.cbc.editor.verifier;

import io.micronaut.json.tree.JsonNode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * One Verifier a verification job calls, with every declared Setting already resolved to exactly
 * one concrete value -- never absent, never the raw Catalog/Override pair a caller would
 * otherwise have to reconcile itself. See {@link #enabled} for how that resolution is done.
 *
 * <p>A present Override value that breaks its Setting's own constraints (wrong JSON type, an
 * unknown select option, a required value left empty, or a text/number value the
 * {@link NumberRule} rejects) is never replaced by the Catalog default -- {@link #settings} keeps
 * the user's value verbatim, invalid or not, and {@link #settingsViolation} names every such
 * break. The Catalog default is used only where the Overrides hold no value for a Setting at all.
 *
 * <p>{@code variableIds} plus, with {@code allowFunctionalVariables}, the program's own variables
 * are the scope this Verifier's Verifier Conditions may reference.
 *
 * @param settings the resolved values in declaration order, keyed by Setting id
 * @param settingsViolation why this Verifier must not be started, from a Setting's invalid value;
 *     empty when every resolved value fits its Setting
 * @param settingsUpdatedAt the Override's settings stamp, or {@code null} when it has none
 */
public record ResolvedVerifier(String id, Map<String, JsonNode> settings, Optional<String> settingsViolation,
        Long settingsUpdatedAt, List<String> variableIds, boolean allowFunctionalVariables) {

    public ResolvedVerifier {
        settings = Collections.unmodifiableMap(new LinkedHashMap<>(settings));
        settingsViolation = settingsViolation == null ? Optional.empty() : settingsViolation;
        variableIds = variableIds == null ? List.of() : List.copyOf(variableIds);
    }

    public ResolvedVerifier(String id, Map<String, JsonNode> settings, Long settingsUpdatedAt,
            List<String> variableIds, boolean allowFunctionalVariables) {
        this(id, settings, Optional.empty(), settingsUpdatedAt, variableIds, allowFunctionalVariables);
    }

    public ResolvedVerifier(String id, Map<String, JsonNode> settings, Long settingsUpdatedAt) {
        this(id, settings, settingsUpdatedAt, List.of(), false);
    }

    /**
     * The Verifiers {@code overrides} mark enabled in Catalog order, each resolved; never the
     * Functional Verifier, which is built in and runs first regardless.
     */
    public static List<ResolvedVerifier> enabled(VerifierCatalog catalog, Map<String, VerifierOverride> overrides) {
        return catalog.verifiers().stream()
            .filter(verifier -> !VerifierCatalogService.FUNCTIONAL_VERIFIER_ID.equals(verifier.id()))
            .filter(verifier -> isEnabled(verifier, overrides.get(verifier.id())))
            .map(verifier -> of(verifier, overrides.get(verifier.id())))
            .toList();
    }

    private static ResolvedVerifier of(Verifier verifier, VerifierOverride override) {
        Resolution resolution = resolveSettings(verifier, override);
        Optional<String> violation = resolution.violations().isEmpty() ? Optional.empty()
            : Optional.of("was not started: " + String.join("; ", resolution.violations()));
        return new ResolvedVerifier(verifier.id(), resolution.settings(), violation,
            override == null ? null : override.settingsUpdatedAt(),
            variableIds(verifier), Boolean.TRUE.equals(verifier.allowFunctionalVariables()));
    }

    /** A Variable without a string {@code id} is skipped; the Self-Description validator rejects it anyway. */
    private static List<String> variableIds(Verifier verifier) {
        List<String> ids = new ArrayList<>();
        for (JsonNode variable : verifier.variables()) {
            JsonNode id = variable.get("id");
            if (id != null && id.isString()) {
                ids.add(id.getStringValue());
            }
        }
        return ids;
    }

    private static boolean isEnabled(Verifier verifier, VerifierOverride override) {
        if (Boolean.FALSE.equals(verifier.toggleable()) || override == null || override.enabled() == null) {
            return verifier.enabled();
        }
        return override.enabled();
    }

    /** The resolved values, in declaration order, next to every Setting's value violation, if any. */
    private record Resolution(Map<String, JsonNode> settings, List<String> violations) {
        Resolution() {
            this(new LinkedHashMap<>(), new ArrayList<>());
        }
    }

    private static Resolution resolveSettings(Verifier verifier, VerifierOverride override) {
        Map<String, com.fasterxml.jackson.databind.JsonNode> inputs =
            override == null || override.settings() == null ? Map.of() : override.settings();
        Resolution resolution = new Resolution();
        for (VerifierSetting setting : verifier.settings()) {
            com.fasterxml.jackson.databind.JsonNode input = inputs.get(setting.id());
            if (input == null) {
                resolution.settings().put(setting.id(), defaultValue(setting));
                continue;
            }
            settingViolation(setting, input).ifPresent(reason -> resolution.violations().add(
                "setting '" + setting.id() + "' has the invalid value '" + describe(input) + "' (" + reason + ")"));
            resolution.settings().put(setting.id(), rawValue(input));
        }
        return resolution;
    }

    private static JsonNode defaultValue(VerifierSetting setting) {
        if (setting.defaultValue() != null) {
            return setting.defaultValue();
        }
        return "boolean".equals(setting.type()) ? JsonNode.createBooleanNode(false) : JsonNode.createStringNode("");
    }

    /**
     * Why a present Override {@code input} does not fit {@code setting}, in the same wording the
     * {@link NumberRule} and {@link SelfDescriptionValidator#defaultViolation} use where a rule is
     * shared with them ({@code "not a string"}, {@code "not a boolean"}, {@code "not one of its
     * options"}); empty when {@code input} is usable as-is.
     */
    private static Optional<String> settingViolation(VerifierSetting setting, com.fasterxml.jackson.databind.JsonNode input) {
        if ("boolean".equals(setting.type())) {
            return input.isBoolean() ? Optional.empty() : Optional.of("not a boolean");
        }
        if (!input.isTextual()) {
            return Optional.of("not a string");
        }
        String value = input.textValue();
        boolean required = Boolean.TRUE.equals(setting.required());
        if ("select".equals(setting.type())) {
            if (value.isEmpty()) {
                // "" is a legal value of an optional select (clears it back to no value); a
                // required select's "" is required-but-empty, never "not one of its options".
                return required ? Optional.of("required but empty") : Optional.empty();
            }
            return isOption(setting, value) ? Optional.empty() : Optional.of("not one of its options");
        }
        if ("number".equals(setting.valueType())) {
            if (value.isEmpty()) {
                return required ? Optional.of("required but empty") : Optional.empty();
            }
            return NumberRule.violation(setting, value);
        }
        // text/string
        if (value.trim().isEmpty()) {
            return required ? Optional.of("required but empty") : Optional.empty();
        }
        return Optional.empty();
    }

    /** Whether {@code value} is one of a select Setting's options; any string fits the other kinds. */
    private static boolean isOption(VerifierSetting setting, String value) {
        if (!"select".equals(setting.type()) || setting.options() == null) {
            return true;
        }
        return setting.options().stream().anyMatch(option -> value.equals(option.id()));
    }

    /** {@code input}'s textual content verbatim, or its JSON form for a violation message. */
    private static String describe(com.fasterxml.jackson.databind.JsonNode input) {
        return input.isTextual() ? input.textValue() : input.toString();
    }

    /** {@code input} converted node-for-node, never substituted. */
    private static JsonNode rawValue(com.fasterxml.jackson.databind.JsonNode input) {
        if (input.isNull()) {
            return JsonNode.nullNode();
        }
        if (input.isBoolean()) {
            return JsonNode.createBooleanNode(input.booleanValue());
        }
        if (input.isTextual()) {
            return JsonNode.createStringNode(input.textValue());
        }
        if (input.isNumber()) {
            return JsonNode.createNumberNode(input.decimalValue());
        }
        if (input.isArray()) {
            List<JsonNode> items = new ArrayList<>();
            input.forEach(item -> items.add(rawValue(item)));
            return JsonNode.createArrayNode(items);
        }
        if (input.isObject()) {
            Map<String, JsonNode> fields = new LinkedHashMap<>();
            input.properties().forEach(entry -> fields.put(entry.getKey(), rawValue(entry.getValue())));
            return JsonNode.createObjectNode(fields);
        }
        return JsonNode.nullNode();
    }
}
