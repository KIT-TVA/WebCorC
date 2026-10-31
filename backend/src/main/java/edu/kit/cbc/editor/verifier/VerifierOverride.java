package edu.kit.cbc.editor.verifier;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;

/**
 * One verifier's worth of user modifications, as persisted in
 * {@code .internal/verifiers.json} — a JSON object keyed by verifier id.
 *
 * <p>Sparse in two directions: only verifiers the user has interacted with have an entry, and
 * an entry carries only the fields that were actually modified. Anything absent falls back to
 * the {@link Verifier} catalog value.
 *
 * <p>{@code enabled} is optional (nullable {@code Boolean}): {@code null} means the user never
 * moved the toggle and the catalog's {@code enabled} applies. It is also ignored for a verifier
 * the catalog marks {@code toggleable: false}, whose enabled state is catalog-owned.
 *
 * <p>{@code settings} maps a setting id to its raw input — a string for text and select
 * settings, a real boolean for boolean ones — kept as {@link JsonNode} so it round-trips
 * losslessly.
 *
 * <p>{@code settingsUpdatedAt} is an opaque stamp, only ever compared for equality;
 * {@code null} when the settings were never changed.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record VerifierOverride(
    Boolean enabled,
    Map<String, JsonNode> settings,
    Long settingsUpdatedAt
) {}
