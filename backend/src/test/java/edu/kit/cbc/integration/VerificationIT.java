package edu.kit.cbc.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.MediaType;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.http.client.exceptions.HttpClientResponseException;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.Timeout;

@MicronautTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class VerificationIT {

    @Inject
    @Client("/")
    HttpClient client;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @Order(1)
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void simpleAssignment_shouldBeProven() throws Exception {
        JsonNode result = submitAndPoll("fixtures/simple_assignment.json", Duration.ofSeconds(55));
        Assertions.assertTrue(result.get("isProven").asBoolean(), "Simple assignment proof failed");
    }

    @Test
    @Order(2)
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void oldExpression_shouldBeProven() throws Exception {
        JsonNode result = submitAndPoll("fixtures/old_expression.json", Duration.ofSeconds(55));
        Assertions.assertTrue(result.get("isProven").asBoolean(), "\\old() expression proof failed");
    }

    @Test
    @Order(3)
    @Timeout(value = 180, unit = TimeUnit.SECONDS)
    void compositionWithSelection_shouldBeProven() throws Exception {
        JsonNode result = submitAndPoll("fixtures/composition_with_selection.json", Duration.ofSeconds(170));
        Assertions.assertTrue(result.get("isProven").asBoolean(), "Composition with selection proof failed");
    }

    private JsonNode submitAndPoll(String fixturePath, Duration timeout) throws Exception {
        String json = loadFixture(fixturePath);

        String jobIdStr = client.toBlocking().retrieve(
            HttpRequest.POST("/editor/verify", json).contentType(MediaType.APPLICATION_JSON)
        );
        UUID jobId = UUID.fromString(jobIdStr.replace("\"", ""));

        long deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            try {
                String resultJson = client.toBlocking().retrieve("/editor/jobs/" + jobId);
                return mapper.readTree(resultJson);
            } catch (HttpClientResponseException e) {
                Thread.sleep(500);
            }
        }

        throw new AssertionError("Timed out waiting for verification job: " + jobId);
    }

    private String loadFixture(String path) throws IOException {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                throw new IOException("Fixture not found: " + path);
            }
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
