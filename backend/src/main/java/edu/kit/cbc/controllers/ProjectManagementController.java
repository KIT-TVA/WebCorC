package edu.kit.cbc.controllers;

import edu.kit.cbc.models.CreateProjectDto;
import edu.kit.cbc.models.ReadProjectDto;
import edu.kit.cbc.models.ProjectService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.Put;
import io.micronaut.http.annotation.QueryValue;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.validation.Valid;

@Controller("/projects")
@ExecuteOn(TaskExecutors.BLOCKING)
public class ProjectManagementController {

    private final ProjectService projectService;

    ProjectManagementController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @Post
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<ReadProjectDto> createProject(@Body @Valid CreateProjectDto project) {
        return HttpResponse.ok(
            projectService.create(project)
        );
    }

    @Get(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<ReadProjectDto> getProject(@QueryValue String id) {
        return HttpResponse.ok(projectService.findById(id));
    }

    @Put(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<ReadProjectDto> modifyProject(@QueryValue String id, @Body @Valid CreateProjectDto project) {
        return HttpResponse.ok(projectService.updateById(id, project));
    }

    @Delete(uri = "/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> deleteProject(@QueryValue String id) {
        //TODO: delete individual project files as well
        projectService.deleteById(id);
        //TODO: add generic non-error response format 
        return HttpResponse.ok(String.format("%s has been deleted", id));
    }
}
