package edu.kit.cbc.editor.verifier.job;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;

/**
 * The root of the program a Verifier receives, mirroring
 * {@code openapi/schema/verifiers/job/program.yml}. {@code preCondition}/{@code postCondition}
 * are the receiving Verifier's own Verifier Condition for the Root, {@code null} (omitted) where
 * none was written.
 */
@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobProgram(
    String name,
    List<String> javaVariables,
    JobCondition preCondition,
    JobCondition postCondition,
    JobStatement statement
) {}
