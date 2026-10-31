package edu.kit.cbc.editor.verifier;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import io.micronaut.json.tree.JsonNode;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Which Verifiers a job calls and with which Settings: the Catalog's {@code enabled} with a
 * non-null Override taking precedence (unless the Catalog locks the toggle), the Functional
 * Verifier never among them; and each one's Settings resolved to one concrete value per
 * declared Setting — the Catalog default (Registry policy already applied) overlaid with the
 * project's Override input, kept verbatim whether or not it fits the Setting's kind. A present
 * value that breaks its Setting's own rules is never replaced by the default; it is reported
 * through {@link ResolvedVerifier#settingsViolation()} instead.
 */
class ResolvedVerifierTest {

    private static final JsonNodeFactory JACKSON = JsonNodeFactory.instance;

    private static final VerifierSetting REPORT_TITLE = new VerifierSetting("reportTitle", "text", "string", "Report title",
        null, false, JsonNode.createStringNode("Mock verification"), null, null, null);
    private static final VerifierSetting THRESHOLD = new VerifierSetting("threshold", "text", "number", "Threshold",
        null, true, JsonNode.createStringNode("50"), null, null, null);
    private static final VerifierSetting STRATEGY = new VerifierSetting("strategy", "select", null, "Strategy",
        null, true, JsonNode.createStringNode("strict"), null, null,
        List.of(new VerifierSetting.Option("strict", "Strict"), new VerifierSetting.Option("lenient", "Lenient")));
    private static final VerifierSetting VERBOSE = new VerifierSetting("verbose", "boolean", null, "Verbose",
        null, null, JsonNode.createBooleanNode(true), null, null, null);
    private static final VerifierSetting COMMENT = new VerifierSetting("comment", "text", "string", "Comment",
        null, false, null, null, null, null);
    private static final VerifierSetting BOUNDED = new VerifierSetting("bounded", "text", "number", "Bounded",
        null, false, JsonNode.createStringNode("10"), new BigDecimal("0.5"),
        new VerifierSetting.Range(BigDecimal.ZERO, new BigDecimal("100")), null);
    private static final VerifierSetting NOTE = new VerifierSetting("note", "text", "string", "Note",
        null, true, JsonNode.createStringNode("default note"), null, null, null);
    private static final VerifierSetting MODE = new VerifierSetting("mode", "select", null, "Mode",
        null, false, JsonNode.createStringNode("fast"), null, null,
        List.of(new VerifierSetting.Option("fast", "Fast"), new VerifierSetting.Option("slow", "Slow")));

    private static Verifier verifier(String id, boolean enabled, Boolean toggleable, VerifierSetting... settings) {
        return new Verifier(id, id, enabled, toggleable, null, List.of(settings), List.of(), null);
    }

    private static JsonNode variable(String id) {
        return JsonNode.createObjectNode(Map.of(
            "id", JsonNode.createStringNode(id),
            "type", JsonNode.createStringNode("double")));
    }

    private static final Verifier FUNC = VerifierCatalogService.merge(
        VerifierCatalogService.FUNCTIONAL_VERIFIER_ID, VerifierCatalogService.FUNCTIONAL_SELF_DESCRIPTION);
    private static final Verifier MOCK =
        verifier("mock", true, true, REPORT_TITLE, THRESHOLD, STRATEGY, VERBOSE, COMMENT, BOUNDED, NOTE, MODE);
    private static final Verifier OFF = verifier("off", false, null);
    private static final Verifier LOCKED_ON = verifier("locked", true, false);
    private static final Verifier DEAD = VerifierCatalogService.lockedOff("dead", null);

    private static final VerifierCatalog CATALOG = new VerifierCatalog(List.of(FUNC, MOCK, OFF, LOCKED_ON, DEAD), null);

    private static VerifierOverride override(Boolean enabled, Map<String, com.fasterxml.jackson.databind.JsonNode> settings) {
        return new VerifierOverride(enabled, settings, null);
    }

    private static List<String> ids(List<ResolvedVerifier> verifiers) {
        return verifiers.stream().map(ResolvedVerifier::id).toList();
    }

    private static ResolvedVerifier mock(List<ResolvedVerifier> verifiers) {
        return verifiers.stream().filter(v -> v.id().equals("mock")).findFirst().orElseThrow();
    }

    // --- Which Verifiers run ------------------------------------------------------------------

    @Test
    void withoutOverridesTheCatalogsEnabledDecidesAndTheFunctionalVerifierIsNeverCalled() {
        List<ResolvedVerifier> verifiers = ResolvedVerifier.enabled(CATALOG, Map.of());

        Assertions.assertEquals(List.of("mock", "locked"), ids(verifiers), "Catalog order, func and disabled entries left out");
    }

    @Test
    void aNonNullOverrideTakesPrecedenceOverTheCatalogsEnabled() {
        List<ResolvedVerifier> verifiers = ResolvedVerifier.enabled(CATALOG, Map.of(
            "mock", override(false, Map.of()),
            "off", override(true, Map.of())));

        Assertions.assertEquals(List.of("off", "locked"), ids(verifiers));
    }

    @Test
    void aNullOverrideLeavesTheCatalogsEnabledInPlace() {
        List<ResolvedVerifier> verifiers = ResolvedVerifier.enabled(CATALOG, Map.of(
            "mock", override(null, Map.of()),
            "off", override(null, null)));

        Assertions.assertEquals(List.of("mock", "locked"), ids(verifiers));
    }

    @Test
    void aLockedToggleIgnoresAContradictingOverride() {
        List<ResolvedVerifier> verifiers = ResolvedVerifier.enabled(CATALOG, Map.of(
            "locked", override(false, Map.of()),
            "dead", override(true, Map.of())));

        Assertions.assertEquals(List.of("mock", "locked"), ids(verifiers),
            "A locked-on Verifier stays on, a locked-off (unavailable) one stays off");
    }

    @Test
    void anOverrideForAnUnknownVerifierIsIgnored() {
        List<ResolvedVerifier> verifiers = ResolvedVerifier.enabled(CATALOG, Map.of("typo", override(true, Map.of())));

        Assertions.assertEquals(List.of("mock", "locked"), ids(verifiers));
    }

    // --- Settings resolution ------------------------------------------------------------------

    @Test
    void withoutOverridesEverySettingIsSentAtItsCatalogDefault() {
        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of()));

        Map<String, JsonNode> expected = new LinkedHashMap<>();
        expected.put("reportTitle", JsonNode.createStringNode("Mock verification"));
        expected.put("threshold", JsonNode.createStringNode("50"));
        expected.put("strategy", JsonNode.createStringNode("strict"));
        expected.put("verbose", JsonNode.createBooleanNode(true));
        expected.put("comment", JsonNode.createStringNode(""));
        expected.put("bounded", JsonNode.createStringNode("10"));
        expected.put("note", JsonNode.createStringNode("default note"));
        expected.put("mode", JsonNode.createStringNode("fast"));
        Assertions.assertEquals(expected, mock.settings());
        Assertions.assertEquals(List.of("reportTitle", "threshold", "strategy", "verbose", "comment", "bounded", "note", "mode"),
            List.copyOf(mock.settings().keySet()), "Declaration order");
        Assertions.assertTrue(mock.settingsViolation().isEmpty(), "An absent value resolves to the default with no violation");
    }

    @Test
    void wellTypedOverrideInputsOverlayTheDefaults() {
        VerifierOverride override = override(null, Map.of(
            "threshold", JACKSON.textNode("75"),
            "strategy", JACKSON.textNode("lenient"),
            "verbose", JACKSON.booleanNode(false),
            "comment", JACKSON.textNode("hello")));

        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of("mock", override)));

        Assertions.assertEquals(JsonNode.createStringNode("Mock verification"), mock.settings().get("reportTitle"),
            "Not overridden: the default");
        Assertions.assertEquals(JsonNode.createStringNode("75"), mock.settings().get("threshold"));
        Assertions.assertEquals(JsonNode.createStringNode("lenient"), mock.settings().get("strategy"));
        Assertions.assertEquals(JsonNode.createBooleanNode(false), mock.settings().get("verbose"));
        Assertions.assertEquals(JsonNode.createStringNode("hello"), mock.settings().get("comment"));
        Assertions.assertTrue(mock.settingsViolation().isEmpty());
    }

    // --- Invalid values: skipped, never defaulted --------------------------------------------

    @Test
    void aWrongJsonTypeAnUnknownSelectOptionAreViolationsAndNoneResolvesToTheDefault() {
        VerifierOverride override = override(null, Map.of(
            "reportTitle", JACKSON.numberNode(5),
            "threshold", JACKSON.booleanNode(true),
            "strategy", JACKSON.textNode("nope"),
            "verbose", JACKSON.textNode("false"),
            "unknown", JACKSON.textNode("dropped")));

        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of("mock", override)));

        Assertions.assertEquals(JsonNode.createNumberNode(JACKSON.numberNode(5).decimalValue()), mock.settings().get("reportTitle"),
            "The user's value is kept, not the default");
        Assertions.assertEquals(JsonNode.createBooleanNode(true), mock.settings().get("threshold"));
        Assertions.assertEquals(JsonNode.createStringNode("nope"), mock.settings().get("strategy"));
        Assertions.assertEquals(JsonNode.createStringNode("false"), mock.settings().get("verbose"));
        Assertions.assertFalse(mock.settings().containsKey("unknown"), "Only declared Settings are sent");

        String reason = mock.settingsViolation().orElseThrow();
        Assertions.assertTrue(reason.startsWith("was not started: "), reason);
        Assertions.assertTrue(reason.contains("setting 'reportTitle' has the invalid value '5' (not a string)"), reason);
        Assertions.assertTrue(reason.contains("setting 'threshold' has the invalid value 'true' (not a string)"), reason);
        Assertions.assertTrue(reason.contains("setting 'strategy' has the invalid value 'nope' (not one of its options)"), reason);
        Assertions.assertTrue(reason.contains("setting 'verbose' has the invalid value 'false' (not a boolean)"), reason);
    }

    @Test
    void jsonNullIsAPresentValueOfTheWrongType() {
        VerifierOverride override = override(null, Map.of("reportTitle", JACKSON.nullNode()));

        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of("mock", override)));

        Assertions.assertEquals(JsonNode.nullNode(), mock.settings().get("reportTitle"));
        Assertions.assertTrue(
            mock.settingsViolation().orElseThrow().contains("setting 'reportTitle' has the invalid value 'null' (not a string)"));
    }

    @Test
    void outOfRangeAndNonDecimalNumberOverridesAreViolationsNamingSettingValueAndRuleBothSettingsAreNamed() {
        VerifierOverride override = override(null, Map.of(
            "bounded", JACKSON.textNode("150"),
            "threshold", JACKSON.textNode("abc")));

        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of("mock", override)));

        Assertions.assertEquals(JsonNode.createStringNode("150"), mock.settings().get("bounded"),
            "The user's value is kept, not the default");
        Assertions.assertEquals(JsonNode.createStringNode("abc"), mock.settings().get("threshold"));
        String reason = mock.settingsViolation().orElseThrow();
        Assertions.assertTrue(reason.contains("setting 'threshold' has the invalid value 'abc' (not a decimal number)"), reason);
        Assertions.assertTrue(reason.contains("setting 'bounded' has the invalid value '150' (above its maximum 100)"), reason);
    }

    @Test
    void anOffStepNumberOverrideIsAViolation() {
        VerifierOverride override = override(null, Map.of("bounded", JACKSON.textNode("10.3")));

        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of("mock", override)));

        Assertions.assertEquals(JsonNode.createStringNode("10.3"), mock.settings().get("bounded"));
        Assertions.assertTrue(mock.settingsViolation().orElseThrow()
            .contains("setting 'bounded' has the invalid value '10.3' (not a multiple of its step 0.5)"));
    }

    @Test
    void requiredEmptyValuesAreViolationsButAnOptionalEmptyNumberIsNot() {
        VerifierOverride override = override(null, Map.of(
            "note", JACKSON.textNode("   "),
            "threshold", JACKSON.textNode(""),
            "strategy", JACKSON.textNode(""),
            "bounded", JACKSON.textNode("")));

        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of("mock", override)));

        String reason = mock.settingsViolation().orElseThrow();
        Assertions.assertTrue(reason.contains("setting 'threshold' has the invalid value '' (required but empty)"), reason);
        Assertions.assertTrue(reason.contains("setting 'strategy' has the invalid value '' (required but empty)"), reason);
        Assertions.assertTrue(reason.contains("setting 'note' has the invalid value '   ' (required but empty)"), reason);
        Assertions.assertFalse(reason.contains("'bounded'"), "An optional number's empty value is not a violation");
        Assertions.assertEquals(JsonNode.createStringNode(""), mock.settings().get("bounded"));
    }

    @Test
    void anOptionalSelectsEmptyValueIsLegalAndResolvesToEmptyEvenWithADefault() {
        VerifierOverride override = override(null, Map.of("mode", JACKSON.textNode("")));

        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of("mock", override)));

        Assertions.assertEquals(JsonNode.createStringNode(""), mock.settings().get("mode"),
            "\"\" clears an optional select back to no value, not its default \"fast\"");
        Assertions.assertTrue(mock.settingsViolation().isEmpty(),
            "An optional select's \"\" is a legal value, not a violation");
    }

    @Test
    void aRequiredSelectsEmptyValueIsStillARequiredButEmptyViolation() {
        VerifierOverride override = override(null, Map.of("strategy", JACKSON.textNode("")));

        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of("mock", override)));

        Assertions.assertEquals(JsonNode.createStringNode(""), mock.settings().get("strategy"));
        Assertions.assertTrue(mock.settingsViolation().orElseThrow()
            .contains("setting 'strategy' has the invalid value '' (required but empty)"));
    }

    @Test
    void theOverridesSettingsStampIsCarriedAlongAndAbsentWithoutOne() {
        List<ResolvedVerifier> verifiers = ResolvedVerifier.enabled(CATALOG, Map.of(
            "mock", new VerifierOverride(null, Map.of(), 1727000000000L)));

        Assertions.assertEquals(1727000000000L, mock(verifiers).settingsUpdatedAt());
        Assertions.assertNull(verifiers.get(1).settingsUpdatedAt(), "No Override: no stamp");
    }

    @Test
    void aVerifierWithoutSettingsGetsAnEmptyMap() {
        List<ResolvedVerifier> verifiers = ResolvedVerifier.enabled(CATALOG, Map.of("locked", override(null, Map.of())));

        Assertions.assertEquals(Map.of(), verifiers.get(1).settings());
    }

    // --- Verifier Condition scope --------------------------------------------------------------

    @Test
    void aVerifiersDeclaredVariablesAndAllowFunctionalVariablesAreCarriedIntoTheResolvedVerifier() {
        Verifier sec = new Verifier("sec", "sec", true, true, null, List.of(),
            List.of(variable("energyBudget"), variable("energyPrevious")), true);
        VerifierCatalog catalog = new VerifierCatalog(List.of(FUNC, sec), null);

        ResolvedVerifier resolved = ResolvedVerifier.enabled(catalog, Map.of()).get(0);

        Assertions.assertEquals(List.of("energyBudget", "energyPrevious"), resolved.variableIds());
        Assertions.assertTrue(resolved.allowFunctionalVariables());
    }

    @Test
    void aVerifierWithoutDeclaredVariablesResolvesToAnEmptyScope() {
        ResolvedVerifier mock = mock(ResolvedVerifier.enabled(CATALOG, Map.of()));

        Assertions.assertEquals(List.of(), mock.variableIds());
        Assertions.assertFalse(mock.allowFunctionalVariables());
    }
}
