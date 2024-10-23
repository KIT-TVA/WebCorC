package edu.kit.cbc.projects.controller;

import de.tu_bs.cs.isf.cbc.cbcmodel.AbstractStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.Condition;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.SkipStatementImpl;
import edu.kit.cbc.projects.CreateProjectDto;
import edu.kit.cbc.projects.ReadProjectDto;
import edu.kit.cbc.projects.ProjectService;
import io.micronaut.core.annotation.Introspected;
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
import io.micronaut.objectstorage.aws.AwsS3Operations;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import io.micronaut.serde.annotation.SerdeImport;
import jakarta.validation.Valid;

@Controller("/projects")
@ExecuteOn(TaskExecutors.BLOCKING)
@SerdeImport(SkipStatementImpl.class)
@SerdeImport(AbstractStatement.class)
@SerdeImport(Condition.class)
@Introspected(classes = {AbstractStatement.class, SkipStatementImpl.class, Condition.class})
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

    @Post(uri = "/testing")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<AbstractStatement> testing(@Body SkipStatementImpl example) {
        example.setProven(!example.isProven());
        //AbstractStatement statement = CbcmodelFactory.eINSTANCE.createSkipStatement();
        //Condition pre = CbcmodelFactory.eINSTANCE.createCondition();
        //pre.setName("asdfb");
        //statement.setPreCondition(pre);
        return HttpResponse.ok(example);
        //return HttpResponse.ok(projectService.findById(id));
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
