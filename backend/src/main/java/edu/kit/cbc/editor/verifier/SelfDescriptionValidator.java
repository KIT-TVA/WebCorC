package edu.kit.cbc.editor.verifier;

import io.micronaut.core.naming.NameUtils;
import io.micronaut.json.tree.JsonNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * Enforces on a parsed {@link SelfDescription} the constraints of the Self-Description schema
 * ({@code openapi/schema/verifiers/selfDescription.yml}, {@code settings/*} and
 * {@code variable.yml}) that the deserializer cannot: the required top-level fields, the four
 * known setting kinds and nothing else, defaults where the schema demands them, unique setting
 * ids, the required fields of every variable, and {@code allowFunctionalVariables} only next to
 * declared variables. A Self-Description that fails is <em>invalid</em> — the Verifier
 * answered, but not with something the Catalog can serve — and is reported as one
 * {@link InvalidVerifierResponseException} listing every violation, so an operator sees all of
 * them at once rather than one per restart.
 *
 * <p>Rules, each with its own reason in the message:
 * <ul>
 *   <li>{@code label} is present and not blank;</li>
 *   <li>{@code enabled} is present;</li>
 *   <li>every setting has an {@code id} and a {@code label};</li>
 *   <li>a setting's {@code type}/{@code valueType} is one of text/string (valueType may be
 *       omitted), text/number, select or boolean — select and boolean carry no
 *       {@code valueType};</li>
 *   <li>a setting carries only the properties its kind declares — every kind is a closed
 *       object: no {@code required} on a boolean, {@code step}/{@code range} only on a
 *       text/number, {@code options} only on a select; one violation names them all. Only
 *       properties <em>some</em> kind declares can be caught here — a property no kind
 *       declares is dropped on deserialization (see {@link VerifierSetting});</li>
 *   <li>{@code required: true} implies a non-empty {@code default} — {@code ""} means "no
 *       default";</li>
 *   <li>a text/number setting's {@code step}, when present, is greater than 0, and its
 *       {@code range.min} is below its {@code range.max} when both are present;</li>
 *   <li>a select setting declares at least one option, and no option id twice;</li>
 *   <li>a boolean setting declares a boolean {@code default};</li>
 *   <li>a text or select setting's {@code default}, when present, is a string; when also
 *       non-empty, a text/number one passes the {@link NumberRule} and a select one is the id of
 *       one of its options — checked only against a {@code step}, {@code range} or option list
 *       that is not itself broken, which is reported on its own instead;</li>
 *   <li>setting ids are unique, also once hyphenated (see
 *       {@link VerifierRegistryEntry#getSettings()});</li>
 *   <li>every variable is an object with string {@code id} and {@code type}, and a
 *       {@code description}, when present, that is a string — {@code type} is free-form, so
 *       nothing about its value is checked;</li>
 *   <li>a variable's {@code id} matches {@code [A-Za-z_][A-Za-z0-9_]*} — it is the sole name a
 *       Verifier Condition references it by, and what the frontend shows;</li>
 *   <li>{@code allowFunctionalVariables: true} only together with non-empty {@code variables}.</li>
 * </ul>
 *
 * <p>The default rules are reconciled with the Verifier Registry's {@code settings.<id>.default}
 * overrides, since the override — not the Verifier's own default — is what the Catalog ends up
 * serving: a flawed own default is downgraded from violation to a returned warning when a
 * fitting override covers it, and the override is held to the very same
 * {@link #defaultViolation default rules} (the Catalog ignores one that fails them). No override
 * covers a broken {@code step}, {@code range} or option list.
 */
public final class SelfDescriptionValidator {

    private SelfDescriptionValidator() {}

    /**
     * Validates a Self-Description, taking into account the Verifier Registry's
     * {@code settings.<id>.default} overrides that will be applied over it: a setting whose own
     * default breaks a rule (missing though required, of the wrong type, outside its range, …) is
     * not a violation when {@code overrides} supplies a default for it that passes the same
     * {@link #defaultViolation rules} — the override is what the Catalog will serve. Such a
     * covered flaw is returned instead of thrown, for the caller to warn about.
     *
     * @param id the Registry id of the Verifier that sent it, for the message
     * @param description the parsed Self-Description
     * @param overrides the Registry's default override for a setting id, if any
     * @return the default rules the Verifier breaks that an override covers, each worded like a
     *     violation ({@code "setting 'x' declares a default that is not a string"}); empty when
     *     the Verifier's own defaults are all usable
     * @throws InvalidVerifierResponseException listing every violated rule
     */
    public static List<String> validate(
        String id, SelfDescription description, Function<String, Optional<JsonNode>> overrides
    ) throws InvalidVerifierResponseException {
        Findings findings = findings(description, overrides);
        if (!findings.violations().isEmpty()) {
            throw new InvalidVerifierResponseException(
                "Self-Description of Verifier '" + id + "' is invalid: " + String.join("; ", findings.violations()), null);
        }
        return findings.overridden();
    }

    /**
     * What validation found: the rules the Self-Description violates and, kept apart, the
     * default rules it breaks that a Registry override covers; both in declaration order.
     */
    private record Findings(List<String> violations, List<String> overridden) {
        Findings() {
            this(new ArrayList<>(), new ArrayList<>());
        }
    }

    private static Findings findings(SelfDescription description, Function<String, Optional<JsonNode>> overrides) {
        Findings findings = new Findings();
        List<String> violations = findings.violations();
        if (description.label() == null || description.label().isBlank()) {
            violations.add("label is missing");
        }
        if (description.enabled() == null) {
            violations.add("enabled is missing");
        }
        Set<String> settingIds = new HashSet<>();
        Map<String, String> firstIdByHyphenatedForm = new HashMap<>();
        List<VerifierSetting> settings = description.settings() == null ? List.of() : description.settings();
        for (int i = 0; i < settings.size(); i++) {
            VerifierSetting setting = settings.get(i);
            if (setting.id() == null || setting.id().isBlank()) {
                violations.add("setting #" + (i + 1) + " has no id");
                continue;
            }
            if (!settingIds.add(setting.id())) {
                violations.add("setting id '" + setting.id() + "' is declared more than once");
            }
            String hyphenatedForm = NameUtils.hyphenate(setting.id(), true);
            String firstId = firstIdByHyphenatedForm.putIfAbsent(hyphenatedForm, setting.id());
            if (firstId != null && !firstId.equals(setting.id())) {
                violations.add("setting ids '" + firstId + "' and '" + setting.id() + "' both hyphenate to '"
                    + hyphenatedForm + "', so a Verifier Registry policy could not address them separately");
            }
            settingFindings(setting, overrides.apply(setting.id()), findings);
        }
        List<JsonNode> variables = description.variables() == null ? List.of() : description.variables();
        for (int i = 0; i < variables.size(); i++) {
            violations.addAll(variableViolations(i + 1, variables.get(i)));
        }
        if (Boolean.TRUE.equals(description.allowFunctionalVariables()) && variables.isEmpty()) {
            violations.add("allowFunctionalVariables is set but no variables are declared");
        }
        return findings;
    }

    /**
     * Files the setting's violations, except that those a fitting {@code override} makes good —
     * the ones that vanish once the override stands in for the setting's own default — go to
     * {@link Findings#overridden()} instead.
     */
    private static void settingFindings(VerifierSetting setting, Optional<JsonNode> override, Findings findings) {
        List<String> own = settingViolations(setting);
        Optional<JsonNode> fitting = override.filter(candidate -> defaultViolation(setting, candidate).isEmpty());
        if (own.isEmpty() || fitting.isEmpty()) {
            findings.violations().addAll(own);
            return;
        }
        List<String> remaining = settingViolations(setting.withDefault(fitting.get()));
        for (String violation : own) {
            (remaining.contains(violation) ? findings.violations() : findings.overridden()).add(violation);
        }
    }

    private static final Pattern VARIABLE_ID = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");

    /**
     * The constraints of {@code variable.yml} on one variable, which the Catalog carries as raw
     * JSON: an object whose {@code id} and {@code type} are present strings, whose {@code id} is
     * also a valid identifier, and whose {@code description}, if any, is a string.
     *
     * @param position 1-based position in {@code variables}, for the message while no id is known
     */
    private static List<String> variableViolations(int position, JsonNode variable) {
        List<String> violations = new ArrayList<>();
        if (variable == null || !variable.isObject()) {
            violations.add("variable #" + position + " is not an object");
            return violations;
        }
        String id = stringField(variable, "id");
        if (id == null || id.isBlank()) {
            violations.add("variable #" + position + " has no id");
            return violations;
        }
        String name = "variable '" + id + "'";
        if (!VARIABLE_ID.matcher(id).matches()) {
            violations.add(name + " has an id that is not a valid identifier");
        }
        String type = stringField(variable, "type");
        if (type == null || type.isBlank()) {
            violations.add(name + " has no type");
        }
        JsonNode variableDescription = variable.get("description");
        if (variableDescription != null && !variableDescription.isString()) {
            violations.add(name + " declares a description that is not a string");
        }
        return violations;
    }

    /** The field's string value, or {@code null} when it is absent or not a string. */
    private static String stringField(JsonNode object, String field) {
        JsonNode value = object.get(field);
        return value != null && value.isString() ? value.getStringValue() : null;
    }

    private static List<String> settingViolations(VerifierSetting setting) {
        List<String> violations = new ArrayList<>();
        String name = "setting '" + setting.id() + "'";
        if (setting.label() == null || setting.label().isBlank()) {
            violations.add(name + " has no label");
        }
        SettingKind kind = SettingKind.of(setting);
        if (kind == SettingKind.UNKNOWN) {
            violations.add(name + " has an unsupported type/valueType combination: "
                + setting.type() + "/" + setting.valueType());
            return violations;
        }
        List<String> foreign = kind.foreignProperties(setting);
        if (!foreign.isEmpty()) {
            violations.add(kind.wording + " " + name + " declares " + String.join(", ", foreign)
                + ", which a " + kind.wording + " setting does not have");
        }
        if (kind == SettingKind.TEXT_NUMBER) {
            if (!NumberRule.stepIsValid(setting.step())) {
                violations.add(name + " declares step " + setting.step().toPlainString()
                    + ", which is not greater than 0");
            }
            if (!NumberRule.rangeIsValid(setting.range())) {
                violations.add(name + " declares a range whose min " + setting.range().min().toPlainString()
                    + " is not below its max " + setting.range().max().toPlainString());
            }
        }
        if (kind == SettingKind.SELECT) {
            if (setting.options() == null || setting.options().isEmpty()) {
                violations.add("select " + name + " declares no options");
            } else {
                violations.addAll(duplicateOptionViolations(name, setting.options()));
            }
        }
        JsonNode defaultValue = setting.defaultValue();
        boolean noDefault = defaultValue == null || (kind != SettingKind.BOOLEAN && isEmptyString(defaultValue));
        boolean requiredWithoutDefault = Boolean.TRUE.equals(setting.required()) && noDefault;
        if (requiredWithoutDefault) {
            violations.add(name + " is required but declares no default");
        }
        if (kind == SettingKind.BOOLEAN && defaultValue == null) {
            violations.add("boolean " + name + " declares no boolean default");
        } else if (defaultValue != null && !requiredWithoutDefault) {
            defaultViolation(setting, defaultValue)
                .ifPresent(reason -> violations.add(name + " declares a default that is " + reason));
        }
        return violations;
    }

    /** One violation per option id a select declares more than once, in declaration order. */
    private static List<String> duplicateOptionViolations(String name, List<VerifierSetting.Option> options) {
        Set<String> seen = new HashSet<>();
        Set<String> reported = new HashSet<>();
        List<String> violations = new ArrayList<>();
        for (VerifierSetting.Option option : options) {
            if (!seen.add(option.id()) && reported.add(option.id())) {
                violations.add("select " + name + " declares option id '" + option.id() + "' more than once");
            }
        }
        return violations;
    }

    private static boolean isEmptyString(JsonNode value) {
        return value != null && value.isString() && value.getStringValue().isEmpty();
    }

    /**
     * The rules a setting puts on a {@code default}, applied to {@code candidate}: a boolean for a
     * boolean setting; a string for a text (string or number valued) or select setting, where
     * {@code ""} means "no default" and is fine unless the setting is required; a non-empty
     * text/number default passes the {@link NumberRule}, and a non-empty select default is the id
     * of one of its options. The Verifier's own default and a Verifier Registry
     * {@code settings.<id>.default} override are held to the same rules.
     *
     * @param setting a setting of a known kind
     * @param candidate a present default value for it
     * @return why {@code candidate} is unusable as the setting's default (e.g. {@code "not a
     *     string"}, {@code "above its maximum 100"}, {@code "not one of its options"}), or empty
     *     when it fits
     */
    static Optional<String> defaultViolation(VerifierSetting setting, JsonNode candidate) {
        SettingKind kind = SettingKind.of(setting);
        if (kind == SettingKind.BOOLEAN) {
            return candidate.isBoolean() ? Optional.empty() : Optional.of("not a boolean");
        }
        if (!candidate.isString()) {
            return Optional.of("not a string");
        }
        String value = candidate.getStringValue();
        if (value.isEmpty()) {
            return Boolean.TRUE.equals(setting.required())
                ? Optional.of("empty, though the setting is required")
                : Optional.empty();
        }
        if (kind == SettingKind.TEXT_NUMBER) {
            return NumberRule.violation(setting, value);
        }
        if (kind == SettingKind.SELECT && setting.options() != null && !setting.options().isEmpty()) {
            boolean isOption = setting.options().stream().anyMatch(option -> value.equals(option.id()));
            return isOption ? Optional.empty() : Optional.of("not one of its options");
        }
        return Optional.empty();
    }

    /**
     * The four kinds of settings the schema knows, discriminated by {@code type}/{@code valueType},
     * plus {@link #UNKNOWN} for any other combination. Each kind is a closed object: it accepts
     * exactly the properties its {@code settings/*.yml} declares, so a property another kind
     * declares — {@code required} on a boolean, {@code step}/{@code range} off a text/number,
     * {@code options} off a select — is a {@link #foreignProperties foreign property}. (A
     * {@code valueType} on a select or boolean is caught earlier, as an unknown combination.)
     */
    private enum SettingKind {
        TEXT_STRING("text/string", false, false),
        TEXT_NUMBER("text/number", true, false),
        SELECT("select", false, true),
        BOOLEAN("boolean", false, false),
        UNKNOWN("unknown", false, false);

        /** How the kind is named in a violation, e.g. {@code "text/number"}. */
        final String wording;
        private final boolean hasStepAndRange;
        private final boolean hasOptions;

        SettingKind(String wording, boolean hasStepAndRange, boolean hasOptions) {
            this.wording = wording;
            this.hasStepAndRange = hasStepAndRange;
            this.hasOptions = hasOptions;
        }

        /**
         * The properties {@code setting} carries that this kind's schema does not declare, in
         * the schema's order; empty when the setting is a closed object of this kind.
         */
        List<String> foreignProperties(VerifierSetting setting) {
            List<String> foreign = new ArrayList<>();
            if (this == BOOLEAN && setting.required() != null) {
                foreign.add("required");
            }
            if (!hasStepAndRange && setting.step() != null) {
                foreign.add("step");
            }
            if (!hasStepAndRange && setting.range() != null) {
                foreign.add("range");
            }
            if (!hasOptions && setting.options() != null) {
                foreign.add("options");
            }
            return foreign;
        }

        static SettingKind of(VerifierSetting setting) {
            String type = setting.type();
            String valueType = setting.valueType();
            if ("text".equals(type)) {
                if (valueType == null || "string".equals(valueType)) {
                    return TEXT_STRING;
                }
                return "number".equals(valueType) ? TEXT_NUMBER : UNKNOWN;
            }
            if (valueType != null) {
                return UNKNOWN;
            }
            if ("select".equals(type)) {
                return SELECT;
            }
            return "boolean".equals(type) ? BOOLEAN : UNKNOWN;
        }
    }
}
