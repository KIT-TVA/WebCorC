package edu.kit.cbc.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micronaut.context.annotation.Property;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.MediaType;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * {@code GET /editor/verifiers} Catalog response with a reachable mock Verifier (via Micronaut Test
 * Resources) and an unreachable entry. Verifies Registry policies (label rename, toggleable lock,
 * setting defaults) apply to the mock's Self-Description, and unreachable entries lock off.
 */
@MicronautTest
@Property(name = "verifiers[0].id", value = "mock")
@Property(name = "verifiers[0].url", value = "http://${mock-verifier.host}:${mock-verifier.port}")
@Property(name = "verifiers[0].label", value = "Mock Verifier (renamed by policy)")
@Property(name = "verifiers[0].toggleable", value = "false")
@Property(name = "verifiers[0].settings.boundedNumberSetting.default", value = "75")
@Property(name = "verifiers[1].id", value = "dead")
@Property(name = "verifiers[1].url", value = "http://127.0.0.1:9")
class VerifierCatalogIT {

    @Inject
    @Client("/")
    HttpClient client;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void catalogListsTheRegisteredMockVerifierAfterTheFunctionalVerifier() throws Exception {
        HttpResponse<String> response = client.toBlocking()
            .exchange(HttpRequest.GET("/editor/verifiers"), String.class);

        Assertions.assertEquals(HttpStatus.OK, response.getStatus());
        Assertions.assertTrue(
            response.getContentType().map(t -> t.matches(MediaType.APPLICATION_JSON_TYPE)).orElse(false),
            "Catalog must be served as JSON");

        JsonNode catalog = mapper.readTree(response.body());
        Assertions.assertTrue(catalog.isObject(), "Catalog is an envelope object");
        Assertions.assertEquals("1 verifier unavailable: dead (unreachable)", catalog.get("message").asText(),
            "One backend-composed console line names the locked-off Verifier and why");

        JsonNode verifiers = catalog.get("verifiers");
        Assertions.assertNotNull(verifiers, "Envelope carries the verifiers array");
        Assertions.assertEquals(List.of("func", "mock", "dead"), ids(verifiers),
            "func first, then Registry order; the unreachable entry keeps its place, locked off");

        assertFunctionalVerifier(verifiers.get(0));
        assertMockVerifier(verifiers.get(1));
        assertLockedOffVerifier(verifiers.get(2));
    }

    private static void assertLockedOffVerifier(JsonNode dead) {
        Assertions.assertEquals("dead (offline)", dead.get("label").asText(), "Fallback label");
        Assertions.assertFalse(dead.get("enabled").asBoolean(), "Locked off");
        Assertions.assertFalse(dead.get("toggleable").asBoolean(), "Locked off");
        Assertions.assertTrue(dead.get("settings").isArray() && dead.get("settings").isEmpty(),
            "No settings (present, empty)");
        Assertions.assertTrue(dead.get("variables").isArray() && dead.get("variables").isEmpty(),
            "No variables (present, empty)");
        Assertions.assertFalse(dead.has("statusPlaceholder"));
        Assertions.assertFalse(dead.has("allowFunctionalVariables"));
    }

    private static List<String> ids(JsonNode verifiers) {
        List<String> ids = new ArrayList<>();
        verifiers.forEach(verifier -> ids.add(verifier.get("id").asText()));
        return ids;
    }

    private static void assertFunctionalVerifier(JsonNode func) {
        Assertions.assertEquals("Functional correctness", func.get("label").asText());
        Assertions.assertTrue(func.get("enabled").asBoolean());
        Assertions.assertFalse(func.get("toggleable").asBoolean(), "Locked on");
        Assertions.assertTrue(func.get("settings").isArray() && func.get("settings").isEmpty(),
            "Functional Verifier declares no settings (present, empty)");
        Assertions.assertTrue(func.get("variables").isArray() && func.get("variables").isEmpty(),
            "Functional Verifier declares no variables (present, empty)");
        Assertions.assertFalse(func.has("statusPlaceholder"), "Functional Verifier has no status placeholder");
        Assertions.assertFalse(func.has("allowFunctionalVariables"));
    }

    private static void assertMockVerifier(JsonNode mock) {
        Assertions.assertEquals("Mock Verifier (renamed by policy)", mock.get("label").asText(),
            "The Registry's label policy wins over the Self-Description's own label");
        Assertions.assertTrue(mock.get("enabled").asBoolean());
        Assertions.assertFalse(mock.get("toggleable").asBoolean(),
            "The Registry's toggleable policy (false) wins over the Self-Description's own true");
        Assertions.assertEquals("Waiting for mock verification…", mock.get("statusPlaceholder").asText());
        Assertions.assertTrue(mock.get("allowFunctionalVariables").asBoolean());

        JsonNode variables = mock.get("variables");
        Assertions.assertEquals(List.of("doubleVariable", "intVariable"), ids(variables));
        Assertions.assertEquals("double", variables.get(0).get("type").asText());
        Assertions.assertTrue(variables.get(0).has("description"));
        Assertions.assertFalse(variables.get(0).has("name"), "name is removed from the schema entirely");
        Assertions.assertEquals("int", variables.get(1).get("type").asText());
        Assertions.assertFalse(variables.get(1).has("description"), "A variable's description is optional");

        JsonNode settings = mock.get("settings");
        Assertions.assertEquals(List.of("textSetting", "emptyTextSetting", "boundedNumberSetting",
                "lowerBoundedNumberSetting", "selectSetting", "optionalSelectSetting", "booleanSetting", "shouldPass"),
            ids(settings), "All four kinds of settings, addressable by id");
        settings.forEach(setting -> Assertions.assertFalse(setting.has("input"),
            "A Catalog setting carries no input: " + setting));

        JsonNode text = settings.get(0);
        Assertions.assertEquals("text", text.get("type").asText());
        Assertions.assertEquals("string", text.get("valueType").asText());
        Assertions.assertEquals("Text setting", text.get("label").asText());
        Assertions.assertEquals("Example text", text.get("default").asText());
        Assertions.assertFalse(text.get("required").asBoolean());

        JsonNode emptyText = settings.get(1);
        Assertions.assertEquals("text", emptyText.get("type").asText());
        Assertions.assertFalse(emptyText.has("default"), "An optional setting may declare no default");
        Assertions.assertFalse(emptyText.has("required"));
        Assertions.assertFalse(emptyText.has("description"));

        JsonNode boundedNumber = settings.get(2);
        Assertions.assertEquals("text", boundedNumber.get("type").asText());
        Assertions.assertEquals("number", boundedNumber.get("valueType").asText());
        Assertions.assertEquals(0.5, boundedNumber.get("step").asDouble());
        Assertions.assertEquals(0, boundedNumber.get("range").get("min").asDouble());
        Assertions.assertEquals(100, boundedNumber.get("range").get("max").asDouble());
        Assertions.assertTrue(boundedNumber.get("required").asBoolean());
        Assertions.assertEquals("75", boundedNumber.get("default").asText(),
            "The Registry's settings.boundedNumberSetting.default policy wins over the Self-Description's own 50");

        JsonNode lowerBoundedNumber = settings.get(3);
        Assertions.assertEquals("number", lowerBoundedNumber.get("valueType").asText());
        Assertions.assertFalse(lowerBoundedNumber.has("step"), "An omitted step means integers only");
        Assertions.assertEquals(0, lowerBoundedNumber.get("range").get("min").asDouble());
        Assertions.assertFalse(lowerBoundedNumber.get("range").has("max"), "Each bound is optional");
        Assertions.assertTrue(lowerBoundedNumber.get("required").asBoolean());
        Assertions.assertEquals("10", lowerBoundedNumber.get("default").asText());

        JsonNode select = settings.get(4);
        Assertions.assertEquals("select", select.get("type").asText());
        Assertions.assertEquals(List.of("optionA", "optionB", "optionC"), ids(select.get("options")));
        Assertions.assertEquals("Option A", select.get("options").get(0).get("label").asText());
        Assertions.assertEquals("optionA", select.get("default").asText());

        JsonNode optionalSelect = settings.get(5);
        Assertions.assertEquals("select", optionalSelect.get("type").asText());
        Assertions.assertEquals(List.of("optionX", "optionY"), ids(optionalSelect.get("options")));
        Assertions.assertFalse(optionalSelect.get("required").asBoolean());
        Assertions.assertFalse(optionalSelect.has("default"), "Optional select may declare no default");

        JsonNode bool = settings.get(6);
        Assertions.assertEquals("boolean", bool.get("type").asText());
        Assertions.assertTrue(bool.get("default").isBoolean(), "Boolean settings carry a real boolean default");
        Assertions.assertFalse(bool.get("default").asBoolean());
    }
}
