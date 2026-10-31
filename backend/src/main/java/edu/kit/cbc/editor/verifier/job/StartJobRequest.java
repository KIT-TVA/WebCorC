package edu.kit.cbc.editor.verifier.job;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.micronaut.json.tree.JsonNode;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import java.util.Map;

/**
 * The body of the start-a-job operation, mirroring
 * {@code openapi/schema/verifiers/job/startRequest.yml}. All three parts are required by the
 * contract: {@code files} is always attached, even when empty, and {@code settings} is the
 * Verifier's <em>resolved</em> Settings — one concrete value per declared Setting, keyed by
 * Setting id; a string for text and select Settings, a boolean for boolean ones (kept as
 * {@link JsonNode}, the same representation the Catalog's defaults and the Overrides use).
 * {@code @JsonInclude(NON_NULL)}, like the sibling job records: the application's configured
 * {@code JsonMapper} otherwise defaults to NON_EMPTY, which would drop {@code files}/{@code
 * settings} entirely for an empty list/map, violating the contract's required fields.
 */
@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
public record StartJobRequest(
    JobProgram program,
    List<SourceFile> files,
    Map<String, JsonNode> settings
) {}
