package edu.kit.cbc.web.controller;

import edu.kit.cbc.web.model.Formula;
import edu.kit.cbc.web.model.Problem;
import java.util.UUID;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.runtime.server.EmbeddedServer;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.MutableHttpRequest;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.uri.UriTemplate;
import io.micronaut.http.cookie.Cookie;
import io.micronaut.http.client.multipart.MultipartBody;
import io.micronaut.core.type.Argument;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Assertions;
import jakarta.inject.Inject;
import reactor.core.publisher.Mono;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.HashSet;


/**
 * API tests for EditorController
 */
@MicronautTest
public class EditorControllerTest {

    @Inject
    EmbeddedServer server;

    @Inject
    @Client
    HttpClient client;

    @Inject
    EditorController controller;

    /**
     * This test is used to validate the implementation of exportWorkspace() method
     *
     * The method should: Export current Workspace
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void exportWorkspaceMethodTest() {
        // given

        // when
        controller.exportWorkspace().block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/editor/export' to the features of exportWorkspace() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void exportWorkspaceClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/editor/export").expand(new HashMap<>());
        MutableHttpRequest<?> request = HttpRequest.POST(uri, null)
            .accept("[Ljava.lang.String;@28c86134");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request); // To retrieve body you must specify required type (e.g. Map.class) as second argument 

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of generateJavaCode() method
     *
     * The method should: 
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void generateJavaCodeMethodTest() {
        // given

        // when
        controller.generateJavaCode().block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/editor/generate' to the features of generateJavaCode() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void generateJavaCodeClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/editor/generate").expand(new HashMap<>());
        MutableHttpRequest<?> request = HttpRequest.POST(uri, null)
            .accept("[Ljava.lang.String;@4492eede");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request); // To retrieve body you must specify required type (e.g. Map.class) as second argument 

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of readJobStatusByUUID() method
     *
     * The method should: Get Job Status Over Websocket
     *
     * Get Job Status
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void readJobStatusByUUIDMethodTest() {
        // given
        UUID id = null;

        // when
        controller.readJobStatusByUUID(id).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/editor/jobs/{id}' to the features of readJobStatusByUUID() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void readJobStatusByUUIDClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/editor/jobs/{id}").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
        }});
        MutableHttpRequest<?> request = HttpRequest.GET(uri)
            .accept("[Ljava.lang.String;@cbc8d0f");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request); // To retrieve body you must specify required type (e.g. Map.class) as second argument 

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of verifyFormula() method
     *
     * The method should: Verify Formula
     *
     * Verify Formula
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void verifyFormulaMethodTest() {
        // given
        Formula formula = new Formula("example", "example", false, "example", "example", "example", "example", Arrays.asList("example"), Arrays.asList(), "example", "example", null);

        // when
        controller.verifyFormula(formula).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/editor/verify' to the features of verifyFormula() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void verifyFormulaClientApiTest() throws IOException {
        // given
        Formula body = new Formula("example", "example", false, "example", "example", "example", "example", Arrays.asList("example"), Arrays.asList(), "example", "example", null);
        String uri = UriTemplate.of("/editor/verify").expand(new HashMap<>());
        MutableHttpRequest<?> request = HttpRequest.POST(uri, body)
            .accept("[Ljava.lang.String;@37b57b54");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request); // To retrieve body you must specify required type (e.g. Map.class) as second argument 

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

}
