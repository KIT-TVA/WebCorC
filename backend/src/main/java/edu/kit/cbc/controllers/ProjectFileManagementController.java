package edu.kit.cbc.controllers;

import edu.kit.cbc.models.DirectoryDto;
import edu.kit.cbc.models.ProjectService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.Put;
import io.micronaut.http.annotation.QueryValue;

@Controller("/projects/{id}/files")
public class ProjectFileManagementController {

    private final ProjectService projectService;

    ProjectFileManagementController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @Get
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<DirectoryDto> getDirectories(@QueryValue String id) {
        return HttpResponse.ok(projectService.findById(id).files());
    }

    @Get(uri = "/{urn}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> getFileOrDirectory(int id, String urn) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d %s", id, urn));
    }

    @Post(uri = "/{urn}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<String> createFileOrDirectory(int id, String urn) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d %s", id, urn));
    }

    @Put(uri = "/{urn}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> modifyFileOrDirectory(int id, String urn) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d %s", id, urn));
    }

    @Delete(uri = "/{urn}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> deleteFileOrDirectory(int id, String urn) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d %s", id, urn));
    }
}
