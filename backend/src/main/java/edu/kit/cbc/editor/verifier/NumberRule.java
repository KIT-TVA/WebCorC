package edu.kit.cbc.editor.verifier;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * The rule a value of a text/number Setting must pass, for a Catalog default and a user's value
 * alike: a strict decimal ({@code -?\d+(\.\d+)?}), within the Setting's inclusive {@code range}
 * and on its step grid — {@code step} (or {@code 1}) apart, anchored at {@code range.min} (or
 * {@code 0}). Range comparisons are exact; the grid check uses the frontend's tolerance
 * ({@code matchesStep} in {@code verifier-validation.ts}), so both sides agree on a value like
 * {@code 0.3} with step {@code 0.1}. A constraint that is itself broken ({@link #stepIsValid},
 * {@link #rangeIsValid}) is not checked against — a broken range is treated as absent, so it
 * does not anchor the grid either.
 */
final class NumberRule {

    private static final Pattern DECIMAL = Pattern.compile("-?\\d+(\\.\\d+)?");
    private static final BigDecimal STEP_EPSILON = new BigDecimal("1e-9");

    private NumberRule() {}

    /**
     * Why {@code value} breaks the rule of {@code setting} — {@code "not a decimal number"},
     * {@code "below its minimum 0"}, {@code "above its maximum 100"} or {@code "not a multiple of
     * its step 0.5"} — or empty when it fits.
     *
     * @param setting a text/number Setting
     * @param value a non-empty value for it; {@code ""} is "no value" and the caller's business
     */
    static Optional<String> violation(VerifierSetting setting, String value) {
        if (!DECIMAL.matcher(value).matches()) {
            return Optional.of("not a decimal number");
        }
        BigDecimal number = new BigDecimal(value);
        VerifierSetting.Range range = rangeIsValid(setting.range()) ? setting.range() : null;
        BigDecimal min = range == null ? null : range.min();
        BigDecimal max = range == null ? null : range.max();
        if (min != null && number.compareTo(min) < 0) {
            return Optional.of("below its minimum " + min.toPlainString());
        }
        if (max != null && number.compareTo(max) > 0) {
            return Optional.of("above its maximum " + max.toPlainString());
        }
        BigDecimal step = setting.step() == null ? BigDecimal.ONE : setting.step();
        if (stepIsValid(setting.step()) && !onGrid(number, step, min == null ? BigDecimal.ZERO : min)) {
            return Optional.of("not a multiple of its step " + step.toPlainString());
        }
        return Optional.empty();
    }

    /** Absent step means {@code 1}. */
    static boolean stepIsValid(BigDecimal step) {
        return step == null || step.signum() > 0;
    }

    static boolean rangeIsValid(VerifierSetting.Range range) {
        return range == null || range.min() == null || range.max() == null || range.min().compareTo(range.max()) < 0;
    }

    /** Whether {@code (value − base) / step} is within the frontend's tolerance of a whole number. */
    private static boolean onGrid(BigDecimal value, BigDecimal step, BigDecimal base) {
        BigDecimal steps = value.subtract(base).divide(step, MathContext.DECIMAL128);
        BigDecimal nearest = steps.setScale(0, RoundingMode.HALF_UP);
        return steps.subtract(nearest).abs().compareTo(STEP_EPSILON) < 0;
    }
}
