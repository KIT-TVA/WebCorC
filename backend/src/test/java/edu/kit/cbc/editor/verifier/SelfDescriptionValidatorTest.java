package edu.kit.cbc.editor.verifier;

import io.micronaut.json.tree.JsonNode;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * A Setting's own constraints and its default: a text/number default is a strict decimal within
 * its range and on its step grid, a select default names one of its options, {@code ""} means
 * "no default", and a broken {@code step}, {@code range} or duplicate option id is a violation of
 * its own. Driven through {@link SelfDescriptionValidator#validate} without Registry overrides;
 * the override interplay is covered in {@link VerifierCatalogServiceTest}.
 */
class SelfDescriptionValidatorTest {

    private static VerifierSetting number(String defaultValue, String step, String min, String max) {
        return number(null, defaultValue, step, min, max);
    }

    private static VerifierSetting number(Boolean required, String defaultValue, String step, String min, String max) {
        VerifierSetting.Range range = min == null && max == null
            ? null
            : new VerifierSetting.Range(decimal(min), decimal(max));
        return new VerifierSetting("n", "text", "number", "n", null, required,
            defaultValue == null ? null : JsonNode.createStringNode(defaultValue), decimal(step), range, null);
    }

    private static VerifierSetting select(Boolean required, String defaultValue, String... optionIds) {
        List<VerifierSetting.Option> options = Arrays.stream(optionIds)
            .map(id -> new VerifierSetting.Option(id, id.toUpperCase()))
            .toList();
        return new VerifierSetting("s", "select", null, "s", null, required,
            defaultValue == null ? null : JsonNode.createStringNode(defaultValue), null, null, options);
    }

    private static VerifierSetting text(Boolean required, String defaultValue) {
        return new VerifierSetting("t", "text", "string", "t", null, required,
            defaultValue == null ? null : JsonNode.createStringNode(defaultValue), null, null, null);
    }

    private static BigDecimal decimal(String value) {
        return value == null ? null : new BigDecimal(value);
    }

    private static List<String> validate(VerifierSetting setting) throws InvalidVerifierResponseException {
        SelfDescription description = new SelfDescription("V", true, null, null, List.of(setting), null, null);
        return SelfDescriptionValidator.validate("v", description, id -> Optional.empty());
    }

    private static void assertValid(VerifierSetting setting) {
        Assertions.assertDoesNotThrow(() -> validate(setting), () -> "Expected " + setting + " to be valid");
    }

    /** The violation message, asserting the setting is rejected. */
    private static String rejection(VerifierSetting setting) {
        return Assertions.assertThrows(InvalidVerifierResponseException.class, () -> validate(setting),
            () -> "Expected " + setting + " to be rejected").getMessage();
    }

    private static void assertRejectedWith(VerifierSetting setting, String reason) {
        String message = rejection(setting);
        Assertions.assertTrue(message.contains(reason), message);
    }

    private static void assertNotContains(String message, String unexpected) {
        Assertions.assertFalse(message.contains(unexpected), message);
    }

    // --- text/number default -----------------------------------------------------------------

    @Test
    void rejectsANumberDefaultThatIsNotAStrictDecimal() {
        for (String notDecimal : List.of("abc", "1e3", " 5", "5 ", ".5", "5.", "+5", "1,5", "--1", "0x10")) {
            assertRejectedWith(number(notDecimal, null, null, null),
                "setting 'n' declares a default that is not a decimal number");
        }
    }

    @Test
    void rejectsANumberDefaultOutsideItsRangeWithItsOwnReason() {
        assertRejectedWith(number("-1", null, "0", "100"), "setting 'n' declares a default that is below its minimum 0");
        assertRejectedWith(number("500", null, "0", "100"),
            "setting 'n' declares a default that is above its maximum 100");
        assertRejectedWith(number("101", null, null, "100"), "above its maximum 100");
        assertRejectedWith(number("-0.5", "0.5", "0", null), "below its minimum 0");
    }

    @Test
    void rejectsANumberDefaultOffItsStepGrid() {
        assertRejectedWith(number("0.3", "0.5", "0", "100"),
            "setting 'n' declares a default that is not a multiple of its step 0.5");
        assertRejectedWith(number("0.5", "0.5", "0.25", null), "not a multiple of its step 0.5");
        assertRejectedWith(number("2.5", null, null, null), "not a multiple of its step 1");
    }

    @Test
    void acceptsNumberDefaultsThatFitEveryConstraint() {
        assertValid(number("0.75", "0.5", "0.25", null));
        assertValid(number("0.25", "0.5", "0.25", "1.25"));
        assertValid(number("1.25", "0.5", "0.25", "1.25"));
        assertValid(number("-7", null, null, null));
        assertValid(number("0.3", "0.1", null, null));
        assertValid(number("50", "0.5", "0", "100"));
        assertValid(number("100.0", null, "0", "100"));
        assertValid(number("-0", null, "0", null));
    }

    // --- text/number structure ----------------------------------------------------------------

    @Test
    void rejectsAStepThatIsNotPositive() {
        assertRejectedWith(number(null, "0", null, null), "setting 'n' declares step 0, which is not greater than 0");
        assertRejectedWith(number(null, "-1", null, null), "step -1");
    }

    @Test
    void rejectsARangeWhoseMinIsNotBelowItsMax() {
        assertRejectedWith(number(null, null, "5", "5"),
            "setting 'n' declares a range whose min 5 is not below its max 5");
        assertRejectedWith(number(null, null, "10", "0"), "min 10 is not below its max 0");
    }

    @Test
    void acceptsARangeWithOneBoundOnly() {
        assertValid(number("7", null, "5", null));
        assertValid(number("3", null, null, "5"));
    }

    @Test
    void doesNotCheckADefaultAgainstABrokenStep() {
        String message = rejection(number("0.3", "0", null, null));

        Assertions.assertTrue(message.contains("step 0"), message);
        assertNotContains(message, "declares a default");
    }

    @Test
    void doesNotCheckADefaultAgainstABrokenRange() {
        String message = rejection(number("500", null, "10", "0"));

        Assertions.assertTrue(message.contains("not below its max"), message);
        assertNotContains(message, "declares a default");
    }

    @Test
    void doesNotAnchorTheStepGridAtABrokenRange() {
        String message = rejection(number("1", "0.5", "0.25", "0"));

        Assertions.assertTrue(message.contains("not below its max"), message);
        assertNotContains(message, "declares a default");
    }

    // --- select -------------------------------------------------------------------------------

    @Test
    void rejectsASelectDefaultThatIsNotAnOption() {
        assertRejectedWith(select(null, "c", "a", "b"), "setting 's' declares a default that is not one of its options");
    }

    @Test
    void acceptsASelectDefaultThatIsAnOption() {
        assertValid(select(true, "b", "a", "b"));
    }

    @Test
    void rejectsADuplicateOptionId() {
        assertRejectedWith(select(null, null, "a", "b", "a"), "select setting 's' declares option id 'a' more than once");
    }

    // --- empty default --------------------------------------------------------------------------

    @Test
    void acceptsAnEmptyDefaultOnAnOptionalSetting() {
        assertValid(text(false, ""));
        assertValid(number(false, "", "0.5", "0", "100"));
        assertValid(select(null, "", "a"));
    }

    @Test
    void treatsAnEmptyDefaultOnARequiredSettingAsMissing() {
        for (VerifierSetting setting : List.of(
            text(true, ""), number(true, "", null, null, null), select(true, "", "a"))) {
            String message = rejection(setting);

            Assertions.assertTrue(message.contains("is required but declares no default"), message);
            assertNotContains(message, "declares a default that is");
        }
    }
}
