package edu.kit.cbc.editor.verifier.job;

import io.micronaut.serde.annotation.Serdeable;

/**
 * A condition as sent to a Verifier, mirroring {@code openapi/schema/verifiers/job/condition.yml}:
 * {@code {condition}}, the editor model's own condition shape.
 */
@Serdeable
public record JobCondition(String condition) {}
