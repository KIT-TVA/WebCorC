package edu.kit.cbc.projects.controller;

import edu.kit.cbc.projects.CreateProjectDto;
import edu.kit.cbc.projects.ProjectService;
import edu.kit.cbc.projects.ReadProjectDto;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.*;
import io.micronaut.objectstorage.aws.AwsS3Operations;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.validation.Valid;

@Controller("/projects")
@ExecuteOn(TaskExecutors.BLOCKING)
public class ProjectsController {

    private final ProjectService projectService;
    private final AwsS3Operations objectStorage;

    ProjectsController(ProjectService projectService, AwsS3Operations objectStorage) {
        this.projectService = projectService;
        this.objectStorage = objectStorage;
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
