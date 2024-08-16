package edu.kit.cbc.web.controller;

import edu.kit.cbc.web.model.Create;
import edu.kit.cbc.web.model.Problem;
import edu.kit.cbc.web.model.Read;
import java.util.UUID;
import edu.kit.cbc.web.model.Update;
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
 * API tests for ProjectManagementController
 */
@MicronautTest
public class ProjectManagementControllerTest {

    @Inject
    EmbeddedServer server;

    @Inject
    @Client
    HttpClient client;

    @Inject
    ProjectManagementController controller;

    /**
     * This test is used to validate the implementation of createProject() method
     *
     * The method should: Create new Project
     *
     * Create a new Project
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void createProjectMethodTest() {
        // given
        Create create = new Create("example");

        // when
        Read result = controller.createProject(create).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects' to the features of createProject() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void createProjectClientApiTest() throws IOException {
        // given
        Create body = new Create("example");
        String uri = UriTemplate.of("/projects").expand(new HashMap<>());
        MutableHttpRequest<?> request = HttpRequest.POST(uri, body)
            .accept("[Ljava.lang.String;@6fd12c5")
            .accept("[Ljava.lang.String;@6fd12c5");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request, Read.class);

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of deleteProjectById() method
     *
     * The method should: Delete Project
     *
     * Delete Project By Id
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void deleteProjectByIdMethodTest() {
        // given
        UUID id = null;

        // when
        controller.deleteProjectById(id).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects/{id}' to the features of deleteProjectById() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void deleteProjectByIdClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/projects/{id}").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
        }});
        MutableHttpRequest<?> request = HttpRequest.DELETE(uri)
            .accept("[Ljava.lang.String;@1de0a46c");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request); // To retrieve body you must specify required type (e.g. Map.class) as second argument 

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of readProjectById() method
     *
     * The method should: Get Project by id
     *
     * Get Information about Project by id.
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void readProjectByIdMethodTest() {
        // given
        UUID id = null;

        // when
        Read result = controller.readProjectById(id).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects/{id}' to the features of readProjectById() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void readProjectByIdClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/projects/{id}").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
        }});
        MutableHttpRequest<?> request = HttpRequest.GET(uri)
            .accept("[Ljava.lang.String;@4d1f1ff5")
            .accept("[Ljava.lang.String;@4d1f1ff5");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request, Read.class);

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of updateProjectById() method
     *
     * The method should: Update Project
     *
     * Update Project by its id
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void updateProjectByIdMethodTest() {
        // given
        UUID id = null;
        Update update = new Update("example");

        // when
        Read result = controller.updateProjectById(id, update).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects/{id}' to the features of updateProjectById() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void updateProjectByIdClientApiTest() throws IOException {
        // given
        Update body = new Update("example");
        String uri = UriTemplate.of("/projects/{id}").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
        }});
        MutableHttpRequest<?> request = HttpRequest.PUT(uri, body)
            .accept("[Ljava.lang.String;@222afc67")
            .accept("[Ljava.lang.String;@222afc67");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request, Read.class);

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

}
