package edu.kit.cbc.editor.verifier;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.micronaut.json.tree.JsonNode;
import io.micronaut.serde.annotation.Serdeable;
import java.math.BigDecimal;
import java.util.List;

/**
 * One Setting a Verifier declares, mirroring {@code openapi/schema/verifiers/setting.yml}: the
 * union of the four kinds — text/string, text/number, select and boolean — flattened into one
 * record, discriminated by {@code type} and, for text settings, {@code valueType}. Fields a
 * kind does not use are {@code null} and omitted from the JSON.
 *
 * <p>Every kind is a closed object ({@code additionalProperties: false}), and so are its nested
 * {@link Range} and {@link Option}. A property some <em>other</em> kind declares deserializes —
 * the record is the union of all kinds — and the {@link SelfDescriptionValidator} rejects it by
 * name. A property <em>no</em> kind declares (a misspelling, say) is dropped here instead of
 * being rejected: the application's {@link io.micronaut.json.JsonMapper} is Jackson databind,
 * which can only ignore unknown properties per type, not fail on them per type
 * ({@code ignoreUnknown = false} merely defers to the mapper-wide
 * {@code FAIL_ON_UNKNOWN_PROPERTIES}, which Micronaut disables). Closing that last gap would take
 * a {@code @JsonAnySetter} creator parameter for the validator to inspect.
 *
 * <p>Settings are addressable by {@code id}: Verifier Registry policy overrides a setting's
 * {@code default} by id, and the user's {@link VerifierOverride} inputs are keyed by it. The
 * Verifier remains the sole authority on which settings exist and what they mean.
 *
 * <p>{@code default} is polymorphic on the wire — a string for text and select settings, a
 * real boolean for boolean ones — and is therefore kept as {@link JsonNode}. It is renamed
 * because it is a Java keyword. Numbers are {@link BigDecimal} so that {@code 0} and
 * {@code 0.5} re-serialize exactly as declared.
 *
 * @param id stable key of the setting
 * @param type {@code text}, {@code select} or {@code boolean}
 * @param valueType for text settings: {@code string} (may be omitted) or {@code number}
 * @param label human-readable label rendered next to the input
 * @param description optional longer description
 * @param required for string-valued settings: whether it must be filled in; implies a default
 * @param defaultValue value used to preinitialize the setting ({@code default} on the wire)
 * @param step for numeric settings: precision grid, {@code 1} when omitted
 * @param range for numeric settings: inclusive bounds, each optional
 * @param options for select settings: the predefined options
 */
@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record VerifierSetting(
    String id,
    String type,
    String valueType,
    String label,
    String description,
    Boolean required,
    @JsonProperty("default") JsonNode defaultValue,
    BigDecimal step,
    Range range,
    List<Option> options
) {

    /**
     * The same Setting with its {@link #defaultValue()} replaced, for the Verifier Registry's
     * {@code settings.<id>.default} policy. Nothing else about the Setting is overridable.
     */
    public VerifierSetting withDefault(JsonNode defaultValue) {
        return new VerifierSetting(id, type, valueType, label, description, required, defaultValue,
            step, range, options);
    }

    /** Inclusive bounds of a numeric setting; each bound is optional. */
    @Serdeable
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Range(BigDecimal min, BigDecimal max) {}

    /** One predefined option of a select setting. */
    @Serdeable
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Option(String id, String label) {}
}
