package edu.kit.cbc.editor.verifier;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.micronaut.json.tree.JsonNode;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;

/**
 * An entry of the Verifier Catalog, mirroring {@code openapi/schema/verifiers/verifier.yml}.
 *
 * <p>The Catalog is read-only for the user; their modifications to it live in
 * {@link VerifierOverride}. Entries are produced by
 * {@link VerifierCatalogService#merge(String, SelfDescription)}: the id is Registry-assigned,
 * everything else comes from the Verifier's {@link SelfDescription}.
 *
 * <p>{@code settings} are typed ({@link VerifierSetting}) so that they are addressable by
 * setting id; {@code variables} are kept as raw {@link JsonNode} entries — their shape is
 * declared by the Verifier and rendered by the frontend, so they round-trip losslessly. Both
 * are always present (possibly empty) on the wire — the frontend relies on the arrays existing.
 *
 * <p>{@code toggleable} is optional (nullable {@code Boolean}): {@code false} locks the enabled
 * toggle at whatever {@code enabled} is declared as — either a mandatory-on verifier
 * ({@code enabled: true}) or a forced-off one ({@code enabled: false}); omitted / {@code null}
 * is equivalent to {@code true} (freely toggleable). A locked verifier's {@code enabled} is
 * catalog-owned, so an override contradicting it is ignored on load.
 *
 * <p>{@code statusPlaceholder} is optional: text the frontend shows in place of a verification
 * status until a live status for this Verifier arrives.
 *
 * <p>{@code allowFunctionalVariables} is optional (nullable {@code Boolean}): {@code true}
 * means the functional variables — the statement's own program variables — may be referenced
 * inside this verifier's non-functional conditions, alongside its own {@code variables}. Only
 * meaningful for a verifier that declares {@code variables} at all; omitted / {@code null} is
 * equivalent to {@code false} (not allowed), so a Catalog must opt in explicitly.
 *
 * <p>Optional fields that are {@code null} are omitted from the JSON rather than emitted as
 * {@code null}: the frontend distinguishes "absent" from "present" (e.g. when ranking entries
 * by whether they have a status placeholder).
 */
@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record Verifier(
    String id,
    String label,
    boolean enabled,
    Boolean toggleable,
    String statusPlaceholder,
    List<VerifierSetting> settings,
    List<JsonNode> variables,
    Boolean allowFunctionalVariables
) {}
