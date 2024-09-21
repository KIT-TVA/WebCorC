package edu.kit.cbc.controllers;

import java.util.Optional;
import java.net.URI;
import java.util.NoSuchElementException;

import edu.kit.cbc.models.DirectoryDto;
import edu.kit.cbc.models.ProjectService;
import edu.kit.cbc.models.ReadProjectDto;
import edu.kit.cbc.models.Problem;
import io.micronaut.http.HttpHeaders;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.MutableHttpResponse;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.Put;
import io.micronaut.http.multipart.CompletedFileUpload;
import io.micronaut.http.server.types.files.StreamedFile;
import io.micronaut.http.server.util.HttpHostResolver;
import io.micronaut.http.uri.UriBuilder;
import io.micronaut.objectstorage.aws.AwsS3ObjectStorageEntry;
import io.micronaut.objectstorage.aws.AwsS3Operations;
import io.micronaut.objectstorage.request.UploadRequest;
import io.micronaut.objectstorage.response.UploadResponse;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

@Controller("/projects/{id}/files")
@ExecuteOn(TaskExecutors.BLOCKING)
public class ProjectFileManagementController {
    private static final String pathFormat = "%s/files/%s";

    private final ProjectService projectService;
    private final AwsS3Operations objectStorage;
    private final HttpHostResolver httpHostResolver;

    ProjectFileManagementController(ProjectService projectService, AwsS3Operations objectStorage, HttpHostResolver httpHostResolver) {
        this.projectService = projectService;
        this.objectStorage = objectStorage;
        this.httpHostResolver = httpHostResolver;
    }

    @Get
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<DirectoryDto> getDirectories(@PathVariable String id) {
        return HttpResponse.ok(projectService.findById(id).files());
    }

    @Get(uri = "/{urn:.*}")
    public Optional<HttpResponse<StreamedFile>> getFile(@PathVariable String id, @PathVariable URI urn) {
        String path = String.format(pathFormat, id, urn);
        return objectStorage.retrieve(path)
            .map(ProjectFileManagementController::buildStreamedFile);
    }

    private static HttpResponse<StreamedFile> buildStreamedFile(AwsS3ObjectStorageEntry entry) {
        GetObjectResponse nativeEntry = entry.getNativeEntry();
        MediaType mediaType = MediaType.of(nativeEntry.contentType());
        StreamedFile file = new StreamedFile(entry.getInputStream(), mediaType).attach(entry.getKey());
        MutableHttpResponse<Object> httpResponse = HttpResponse.ok()
            .header(HttpHeaders.ETAG, nativeEntry.eTag());
        file.process(httpResponse);
        return httpResponse.body(file);
    }

    @Post(uri = "/{urn:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public HttpResponse<?> uploadFile(
            CompletedFileUpload fileUpload,
            @PathVariable String id,
            @PathVariable URI urn,
            HttpRequest<?> request) {
        String path = String.format(pathFormat, id, urn);

        ReadProjectDto project;
        try {
            project = projectService.findById(id);
        } catch (NoSuchElementException e) {
            return HttpResponse.notFound(new Problem("about:blank", "Not found", 404, String.format("project with id %s was not found", id), "about:blank"));
        }

        UploadRequest objectStorageUpload = UploadRequest.fromCompletedFileUpload(fileUpload, path);
        UploadResponse<PutObjectResponse> response = objectStorage.upload(objectStorageUpload, builder -> {
            builder.acl(ObjectCannedACL.PUBLIC_READ);
        });

        //TODO: Move adding/removing logic to projectServive
        project.files().addFilePath(urn);
        projectService.updateById(id, project);

        return HttpResponse
            .created(UriBuilder.of(httpHostResolver.resolve(request))
                    .path("projects")
                    .path(path)
                    .build())
            .header(HttpHeaders.ETAG, response.getETag());
    }

    @Put(uri = "/{urn:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> modifyFileOrDirectory(@PathVariable String id, @PathVariable String urn) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %s %s", id, urn));
    }

    @Delete(uri = "/{urn:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<?> deleteFileOrDirectory(@PathVariable String id, @PathVariable URI urn) {
        String path = String.format(pathFormat, id, urn);
        //TODO: should project existence be checked first?
        objectStorage.delete(path);

        //TODO: Move adding/removing logic to projectServive
        ReadProjectDto project = projectService.findById(id);
        project.files().removeFilePath(urn);
        projectService.updateById(id, project);

        return HttpResponse.ok("file deleted");
    }
}
