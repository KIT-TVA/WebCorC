package edu.kit.cbc.editor.verifier;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.micronaut.json.tree.JsonNode;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;

/**
 * What a Verifier declares about itself through the Verifier API ({@code GET /description}),
 * mirroring {@code openapi/schema/verifiers/selfDescription.yml}: the {@link Verifier} Catalog
 * entry <em>minus</em> {@code id} — the id is assigned by the Verifier Registry, so the same
 * Verifier image can be registered under any id.
 *
 * <p>{@code enabled} and {@code toggleable} are the Verifier's <em>defaults</em>; the Registry
 * may apply deployment policy over them before the entry reaches the Catalog. The Verifier is
 * the sole authority on which {@code settings} exist and what they mean.
 *
 * <p>Deserialized by the {@link VerifierClient} from the Verifier's response; a body that does
 * not parse to this shape is an <em>invalid response</em>. Fields the Verifier omits are
 * {@code null} here — including the schema-required {@code enabled}, which is therefore a
 * nullable {@link Boolean} rather than a primitive, so that its absence reaches the
 * {@link SelfDescriptionValidator} instead of silently reading as {@code false}.
 * {@link VerifierCatalogService#merge(String, SelfDescription)} turns absent
 * {@code settings}/{@code variables} into empty lists for the Catalog.
 *
 * <p>The Functional Verifier is not fetched but described by the constant
 * {@link VerifierCatalogService#FUNCTIONAL_SELF_DESCRIPTION}, so that it passes through the
 * same merge step as every remote Verifier.
 */
@Serdeable
@JsonIgnoreProperties(ignoreUnknown = true)
public record SelfDescription(
    String label,
    Boolean enabled,
    Boolean toggleable,
    String statusPlaceholder,
    List<VerifierSetting> settings,
    List<JsonNode> variables,
    Boolean allowFunctionalVariables
) {}
