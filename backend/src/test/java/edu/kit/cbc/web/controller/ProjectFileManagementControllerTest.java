package edu.kit.cbc.web.controller;

import edu.kit.cbc.web.model.Directory;
import edu.kit.cbc.web.model.Filecontent;
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
 * API tests for ProjectFileManagementController
 */
@MicronautTest
public class ProjectFileManagementControllerTest {

    @Inject
    EmbeddedServer server;

    @Inject
    @Client
    HttpClient client;

    @Inject
    ProjectFileManagementController controller;

    /**
     * This test is used to validate the implementation of createFileorDirectory() method
     *
     * The method should: Create File / Directory
     *
     * Create new File / Directory
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void createFileorDirectoryMethodTest() {
        // given
        UUID id = null;
        String urn = "example";

        // when
        Filecontent result = controller.createFileorDirectory(id, urn).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects/{id}/files/{urn}' to the features of createFileorDirectory() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void createFileorDirectoryClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/projects/{id}/files/{urn}").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
            put("urn", "example");
        }});
        MutableHttpRequest<?> request = HttpRequest.POST(uri, null)
            .accept("[Ljava.lang.String;@34f392be")
            .accept("[Ljava.lang.String;@34f392be");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request, Filecontent.class);

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of deleteFileByURN() method
     *
     * The method should: Delete File
     *
     * Delete File
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void deleteFileByURNMethodTest() {
        // given
        UUID id = null;
        String urn = "example";

        // when
        controller.deleteFileByURN(id, urn).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects/{id}/files/{urn}' to the features of deleteFileByURN() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void deleteFileByURNClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/projects/{id}/files/{urn}").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
            put("urn", "example");
        }});
        MutableHttpRequest<?> request = HttpRequest.DELETE(uri)
            .accept("[Ljava.lang.String;@4554de02");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request); // To retrieve body you must specify required type (e.g. Map.class) as second argument 

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of getFileTreeByProjectId() method
     *
     * The method should: Get File / Directory Structure (optional??)
     *
     * Create new File / Directory
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void getFileTreeByProjectIdMethodTest() {
        // given
        UUID id = null;

        // when
        Directory result = controller.getFileTreeByProjectId(id).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects/{id}/files' to the features of getFileTreeByProjectId() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void getFileTreeByProjectIdClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/projects/{id}/files").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
        }});
        MutableHttpRequest<?> request = HttpRequest.GET(uri)
            .accept("[Ljava.lang.String;@3f9f71ff")
            .accept("[Ljava.lang.String;@3f9f71ff");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request, Directory.class);

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of readFileContentByURN() method
     *
     * The method should: Get Directory or file contents
     *
     * Read all Project Files
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void readFileContentByURNMethodTest() {
        // given
        UUID id = null;
        String urn = "example";

        // when
        Filecontent result = controller.readFileContentByURN(id, urn).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects/{id}/files/{urn}' to the features of readFileContentByURN() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void readFileContentByURNClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/projects/{id}/files/{urn}").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
            put("urn", "example");
        }});
        MutableHttpRequest<?> request = HttpRequest.GET(uri)
            .accept("[Ljava.lang.String;@fabb651")
            .accept("[Ljava.lang.String;@fabb651");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request, Filecontent.class);

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

    /**
     * This test is used to validate the implementation of updateProjectFileByURN() method
     *
     * The method should: Update File Content
     *
     * Update file content
     *
     * TODO fill in the parameters and test return value.
     */
    @Test
    @Disabled("Not Implemented")
    void updateProjectFileByURNMethodTest() {
        // given
        UUID id = null;
        String urn = "example";

        // when
        Filecontent result = controller.updateProjectFileByURN(id, urn).block();

        // then
        Assertions.assertTrue(true);
    }

    /**
     * This test is used to check that the api available to client through
     * '/projects/{id}/files/{urn}' to the features of updateProjectFileByURN() works as desired.
     *
     * TODO fill in the request parameters and test response.
     */
    @Test
    @Disabled("Not Implemented")
    void updateProjectFileByURNClientApiTest() throws IOException {
        // given
        String uri = UriTemplate.of("/projects/{id}/files/{urn}").expand(new HashMap<String, Object>(){{
            // Fill in the path variables
            put("id", null);
            put("urn", "example");
        }});
        MutableHttpRequest<?> request = HttpRequest.PUT(uri, null)
            .accept("[Ljava.lang.String;@27e5b378")
            .accept("[Ljava.lang.String;@27e5b378");

        // when
        HttpResponse<?> response = client.toBlocking().exchange(request, Filecontent.class);

        // then
        Assertions.assertEquals(HttpStatus.OK, response.status());
    }

}
