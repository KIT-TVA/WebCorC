package edu.kit.cbc.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.cbc.editor.verifier.VerifierRegistry;
import edu.kit.cbc.editor.verifier.VerifierRegistryEntry;
import io.micronaut.context.annotation.Property;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import jakarta.inject.Inject;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Registry entries are bound in configuration order. Unreachable entries are locked off in
 * the Catalog and named in the message.
 */
@MicronautTest
@Property(name = "verifiers[0].id", value = "eebc")
@Property(name = "verifiers[0].url", value = "http://eebc:8080")
@Property(name = "verifiers[1].id", value = "sec")
@Property(name = "verifiers[1].url", value = "http://sec:8080")
class VerifierRegistryIT {

    @Inject
    VerifierRegistry registry;

    @Inject
    @Client("/")
    HttpClient client;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void entriesAreBoundInConfiguredOrder() {
        List<VerifierRegistryEntry> entries = registry.entries();

        Assertions.assertEquals(List.of("eebc", "sec"),
            entries.stream().map(VerifierRegistryEntry::getId).toList());
        Assertions.assertEquals("http://eebc:8080", entries.get(0).getUrl());
        Assertions.assertEquals("http://sec:8080", entries.get(1).getUrl());
    }

    @Test
    void unreachableEntriesAreLockedOffInRegistryOrder() throws Exception {
        JsonNode catalog = mapper.readTree(client.toBlocking().retrieve("/editor/verifiers"));

        JsonNode verifiers = catalog.get("verifiers");
        Assertions.assertEquals(3, verifiers.size());
        Assertions.assertEquals("func", verifiers.get(0).get("id").asText());
        Assertions.assertEquals("eebc", verifiers.get(1).get("id").asText());
        Assertions.assertEquals("eebc (offline)", verifiers.get(1).get("label").asText());
        Assertions.assertFalse(verifiers.get(1).get("enabled").asBoolean());
        Assertions.assertFalse(verifiers.get(1).get("toggleable").asBoolean());
        Assertions.assertEquals("sec", verifiers.get(2).get("id").asText());
        Assertions.assertEquals("sec (offline)", verifiers.get(2).get("label").asText());
        Assertions.assertEquals("2 verifiers unavailable: eebc (unreachable), sec (unreachable)",
            catalog.get("message").asText());
    }
}
