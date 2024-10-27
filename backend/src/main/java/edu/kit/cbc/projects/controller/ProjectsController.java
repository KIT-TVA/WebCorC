package edu.kit.cbc.projects.controller;

import org.eclipse.emfcloud.jackson.module.EMFModule;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import de.tu_bs.cs.isf.cbc.cbcmodel.AbstractStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbcmodelPackage;

import edu.kit.cbc.projects.CreateProjectDto;
import edu.kit.cbc.projects.ReadProjectDto;
import edu.kit.cbc.projects.ProjectService;

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

    @Post(uri = "/testing")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> testing(@Body String cbcFormulaString) {
        ObjectMapper mapper = EMFModule.setupDefaultMapper();

        //This is necessary to initialize and register the package so
        //emfjson-jackson can actually use the generated classes
        CbcmodelPackage cbcmodelPackage = CbcmodelPackage.eINSTANCE;

        CbCFormula formula;
        try {
            formula = mapper.reader()
                .forType(AbstractStatement.class)
                .readValue(cbcFormulaString);
            formula.setProven(!formula.isProven());
            return HttpResponse.ok(
                mapper.writeValueAsString(formula)
            );
        } catch (JsonProcessingException e) {
            return HttpResponse.badRequest(e.getMessage());
        }
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
