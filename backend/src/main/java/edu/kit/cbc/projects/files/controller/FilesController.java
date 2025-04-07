package edu.kit.cbc.projects.files.controller;

import edu.kit.cbc.common.Problem;
import edu.kit.cbc.projects.ProjectService;
import edu.kit.cbc.projects.files.S3ClientProvider;
import edu.kit.cbc.projects.files.dto.DirectoryDto;
import io.micronaut.http.*;
import io.micronaut.http.annotation.*;
import io.micronaut.http.annotation.Delete;
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
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Optional;

@Controller("/projects/{id}/files")
@ExecuteOn(TaskExecutors.BLOCKING)
public class FilesController {
    private static final String pathFormat = "%s/files/%s";

    private final ProjectService projectService;
    private final AwsS3Operations objectStorage;
    private final S3ClientProvider s3ClientProvider;
    private final HttpHostResolver httpHostResolver;

    FilesController(ProjectService projectService, AwsS3Operations objectStorage, S3ClientProvider s3ClientProvider, HttpHostResolver httpHostResolver) {
        this.projectService = projectService;
        this.objectStorage = objectStorage;
        this.s3ClientProvider = s3ClientProvider;
        this.httpHostResolver = httpHostResolver;
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

    @Get
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<DirectoryDto> getDirectories(@PathVariable String id) {
        return HttpResponse.ok(projectService.findById(id).files());
    }

    public List<String> findJavaFilesOfProject(String id) {
        String bucketName = s3ClientProvider.getBucketName();

        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(id)
                .build();

        ListObjectsV2Response response = s3ClientProvider.getClient().listObjectsV2(request);

        List<String> keys = response.contents().stream()
                .filter(obj -> {
                    return obj.key().endsWith(".java");
                })
                .map(obj -> {
                    return obj.key().substring(id.concat("/files/").length());
                })
                .toList();

        return keys;
    }

    @Get(uri = "/{urn:.*}")
    public Optional<HttpResponse<StreamedFile>> getFile(@PathVariable String id, @PathVariable URI urn) {
        String path = String.format(pathFormat, id, urn);
        return objectStorage.retrieve(path)
                .map(FilesController::buildStreamedFile);
    }

    @Post(uri = "/{urn:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public HttpResponse<?> uploadFile(
            CompletedFileUpload fileUpload,
            @PathVariable String id,
            @PathVariable URI urn,
            HttpRequest<?> request) {
        if (!projectService.existsById(id)) {
            return HttpResponse.notFound(new Problem("about:blank", "Not found", 404, String.format("project with id %s was not found", id), "about:blank"));
        }

        String path = String.format(pathFormat, id, urn);

        UploadRequest objectStorageUpload = UploadRequest.fromCompletedFileUpload(fileUpload, path);
        UploadResponse<PutObjectResponse> response = performUpload(objectStorageUpload, id, urn);

        return HttpResponse
                .created(UriBuilder.of(httpHostResolver.resolve(request))
                        .path("projects")
                        .path(path)
                        .build())
                .header(HttpHeaders.ETAG, response.getETag());
    }

    public void uploadBytes(byte[] bytes, String id, URI urn) throws IOException {
        if (!projectService.existsById(id)) {
            return;
        }

        String path = String.format(pathFormat, id, urn);

        UploadRequest objectStorageUpload = UploadRequest.fromBytes(bytes, path);
        performUpload(objectStorageUpload, id, urn);
    }

    private UploadResponse<PutObjectResponse> performUpload(UploadRequest uploadRequest, String id, URI urn) {
        UploadResponse<PutObjectResponse> response = objectStorage.upload(uploadRequest, builder -> {
            builder.acl(ObjectCannedACL.PUBLIC_READ);
        });
        projectService.addFilePathToId(id, urn);
        return response;
    }

    @Put(uri = "/{urn:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> modifyFileOrDirectory(@PathVariable String id, @PathVariable String urn) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %s %s", id, urn));
    }

    @Delete(uri = "/{urn:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<?> deleteFileOrDirectory(@PathVariable String id, @PathVariable URI urn) {
        if (!projectService.existsById(id)) {
            return HttpResponse.notFound(new Problem("about:blank", "Not found", 404, String.format("project with id %s was not found", id), "about:blank"));
        }

        String path = String.format(pathFormat, id, urn);
        objectStorage.delete(path); //TODO: doesn't delete folders with children
        projectService.removeFilePathFromId(id, urn);

        return HttpResponse.ok("file deleted");
    }
}
