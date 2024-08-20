package edu.kit.cbc.Controllers;

import java.util.UUID;

import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.Put;

@Controller("/projects")
public class ProjectManagementController {
    @Post
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<String> createProject() {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %s", UUID.randomUUID().toString()));
    }

    @Get(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> getProject(long id) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }

    @Put(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> modifyProject(long id) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }

    @Delete(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> deleteProject(long id) {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }
}
