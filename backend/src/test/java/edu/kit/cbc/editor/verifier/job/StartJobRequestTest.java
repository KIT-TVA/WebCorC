package edu.kit.cbc.editor.verifier.job;

import io.micronaut.json.JsonMapper;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Serializes {@link StartJobRequest} through the application's configured {@link JsonMapper} —
 * whose default inclusion drops null AND empty values, unlike the plain {@code
 * JsonMapper.createDefault()} used by {@link edu.kit.cbc.editor.verifier.HttpVerifierClientJobTest}
 * — because that default is exactly what dropped {@code files} for a formula with no project
 * files, even though the Verifier API requires it, always attached
 * ({@code openapi/schema/verifiers/job/startRequest.yml}).
 */
@MicronautTest
class StartJobRequestTest {

    @Inject
    JsonMapper jsonMapper;

    @Test
    void emptyFilesAndSettingsAreStillSerialized() throws Exception {
        JobProgram program = new JobProgram("demo", List.of(), null, null, JobStatement.skip(0, "root", null, null));
        StartJobRequest request = new StartJobRequest(program, List.of(), Map.of());

        String body = jsonMapper.writeValueAsString(request).replaceAll("\\s+", "");

        Assertions.assertTrue(body.contains("\"files\":[]"), "was: " + body);
        Assertions.assertTrue(body.contains("\"settings\":{}"), "was: " + body);
    }
}
