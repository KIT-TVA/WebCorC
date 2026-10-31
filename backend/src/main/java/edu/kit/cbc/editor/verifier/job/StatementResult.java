package edu.kit.cbc.editor.verifier.job;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.micronaut.serde.annotation.Serdeable;

/**
 * One statement's result from a Verifier, mirroring an entry of
 * {@code openapi/schema/verifiers/job/result.yml}. {@code status} is opaque Verifier Status
 * text, {@code null} when the Verifier has nothing to say. {@code proven} is required by the
 * contract but nullable here so that its absence reaches the client's validation instead of
 * silently reading as {@code false}; a result the client hands out always has it set.
 */
@Serdeable
@JsonIgnoreProperties(ignoreUnknown = true)
public record StatementResult(Boolean proven, String status) {}
