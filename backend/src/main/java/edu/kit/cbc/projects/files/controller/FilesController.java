package edu.kit.cbc.projects.files.controller;

import edu.kit.cbc.common.Problem;
import edu.kit.cbc.common.corc.FileUtil;
import edu.kit.cbc.projects.ProjectService;
import edu.kit.cbc.projects.files.S3ClientProvider;
import edu.kit.cbc.projects.files.dto.DirectoryDto;
import io.micronaut.http.HttpHeaders;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.MutableHttpResponse;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
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
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

@Controller("/projects/{id}/files")
@ExecuteOn(TaskExecutors.BLOCKING)
public class FilesController {
    private static final String PATH_FORMAT = "%s/files/%s";
    private static final String SUBFOLDER_PATH_FORMAT = "%s/files/%s/";

    private final ProjectService projectService;
    private final AwsS3Operations objectStorage;
    private final S3ClientProvider s3ClientProvider;
    private final HttpHostResolver httpHostResolver;

    FilesController(ProjectService projectService, AwsS3Operations objectStorage, S3ClientProvider s3ClientProvider,
                    HttpHostResolver httpHostResolver) {
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

    public List<Path> retrieveFiles(String projectId, String extension, String subFolder) throws IOException {
        Path targetFolder = Files.createTempDirectory(subFolder);
        Collection<String> relevantFiles = new ArrayList<>(findFilesWithExtension(projectId, subFolder, extension));

        if (relevantFiles.isEmpty()) {
            FileUtil.deleteDirectory(targetFolder);
        }

        for (String file : relevantFiles) {
            Optional<HttpResponse<StreamedFile>> response = getFile(projectId, URI.create(file));
            if (response.isPresent()) {
                InputStream fileInput = response.get().body().getInputStream();
                Files.copy(fileInput, targetFolder.resolve(file));
            }
        }


        return relevantFiles.stream().map(targetFolder::resolve).toList();
    }

    private List<String> findFilesWithExtension(String id, String subFolder, String extension) {
        String bucketName = s3ClientProvider.getBucketName();

        ListObjectsV2Request request = ListObjectsV2Request.builder()
            .bucket(bucketName)
            .prefix(id)
            .build();

        ListObjectsV2Response response = s3ClientProvider.getClient().listObjectsV2(request);

        return response.contents().stream()
            .filter(obj -> obj.key().substring((String.format(PATH_FORMAT, id, "")).length()).startsWith(subFolder))
            .filter(obj -> obj.key().endsWith(extension))
            .map(obj -> obj.key().substring((String.format(SUBFOLDER_PATH_FORMAT, id, subFolder)).length()))
            .toList();
    }

    @Get(uri = "/{urn:.*}")
    public Optional<HttpResponse<StreamedFile>> getFile(@PathVariable String id, @PathVariable URI urn) {
        String path = String.format(PATH_FORMAT, id, urn);
        return objectStorage.retrieve(path)
            .map(FilesController::buildStreamedFile);
    }

    @Post(uri = "/{path:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public HttpResponse<?> uploadFile(
        CompletedFileUpload fileUpload,
        @PathVariable String id,
        @PathVariable Path path,
        HttpRequest<?> request) {
        if (!projectService.existsById(id)) {
            return HttpResponse.notFound(new Problem("about:blank", "Not found", 404,
                String.format("project with id %s was not found", id), "about:blank"));
        }

        String uploadPath = String.format(PATH_FORMAT, id, path);

        UploadRequest objectStorageUpload = UploadRequest.fromCompletedFileUpload(fileUpload, uploadPath);
        UploadResponse<PutObjectResponse> response = performUpload(objectStorageUpload, id, path);

        return HttpResponse
            .created(UriBuilder.of(httpHostResolver.resolve(request))
                .path("projects")
                .path(uploadPath)
                .build())
            .header(HttpHeaders.ETAG, response.getETag());
    }

    public void uploadBytes(byte[] bytes, String id, Path uploadPath) throws IOException {
        if (!projectService.existsById(id)) {
            return;
        }

        String path = String.format(PATH_FORMAT, id, uploadPath);

        UploadRequest objectStorageUpload = UploadRequest.fromBytes(bytes, path);
        performUpload(objectStorageUpload, id, uploadPath);
    }

    private UploadResponse<PutObjectResponse> performUpload(UploadRequest uploadRequest, String id, Path uploadPath) {
        UploadResponse<PutObjectResponse> response = objectStorage.upload(uploadRequest, builder -> {
            builder.acl(ObjectCannedACL.PUBLIC_READ);
        });
        projectService.addFilePathToId(id, uploadPath);
        return response;
    }

    @Put(uri = "/{urn:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> modifyFileOrDirectory(@PathVariable String id, @PathVariable String urn) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %s %s", id, urn));
    }

    @Delete(uri = "/{path:.*}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<?> deleteFileOrDirectory(@PathVariable String id, @PathVariable Path path) {
        if (!projectService.existsById(id)) {
            return HttpResponse.notFound(new Problem("about:blank", "Not found", 404,
                String.format("project with id %s was not found", id), "about:blank"));
        }

        String objectPath = String.format(PATH_FORMAT, id, path);
        objectStorage.delete(objectPath); //TODO: doesn't delete folders with children
        projectService.removeFilePathFromId(id, path);

        return HttpResponse.ok("file deleted");
    }
}
