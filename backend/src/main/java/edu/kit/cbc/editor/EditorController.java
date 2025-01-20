package edu.kit.cbc.editor;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import com.fasterxml.jackson.core.JsonProcessingException;

import edu.kit.cbc.common.CbCFormulaContainer;
import edu.kit.cbc.common.Problem;
import edu.kit.cbc.common.corc.VerifyAllStatements;
import edu.kit.cbc.projects.files.controller.FilesController;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.QueryValue;
import io.micronaut.http.server.types.files.StreamedFile;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;


@Controller("/editor")
@ExecuteOn(TaskExecutors.BLOCKING)
public class EditorController {

    private final FilesController filesController;
    private final FormulaParser parser;

    EditorController(FilesController filesController, FormulaParser parser) {
        this.filesController = filesController;
        this.parser = parser;
    }

    @Post(uri = "/export")
    @Produces(MediaType.APPLICATION_ZIP)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<String> export() {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED"));
    }

    @Post(uri = "/generate")
    @Produces(MediaType.APPLICATION_ZIP)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<String> generate() {
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED"));
    }

    @Post(uri = "/xmltojson")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.ALL)
    public HttpResponse<?> xmltojson(@Body String cbcFormulaString) {
        try {
            CbCFormulaContainer c = parser.fromXMLStringToCbC(cbcFormulaString);
            return HttpResponse.ok(parser.toJsonString(c));
        } catch (IOException e) {
            return HttpResponse.serverError(Problem.PARSING_ERROR(e.getMessage()));
        }
    }

    @Post(uri = "/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> verify(@QueryValue Optional<String> projectId, @Body String cbcFormulaString) {
        try {
            CbCFormulaContainer formula = parser.fromJsonStringToCbC(cbcFormulaString);
            try {
                Path p = Files.createTempDirectory("proof_");
                if (projectId.isPresent()) {
                    //TODO: fetch java files from object storage
                    Optional<HttpResponse<StreamedFile>> response = filesController.getFile(projectId.get(), URI.create("helper.key"));
                    if (response.isPresent()) {
                        Path fullPath = Files.createDirectory(p.resolve("prove_"));
                        InputStream e = response.get().body().getInputStream();
                        Files.copy(e, fullPath.resolve("helper.key"));
                    }
                }
                VerifyAllStatements.verify(formula.cbCFormula(), formula.javaVariables(), formula.globalConditions(), formula.renaming(), p.toUri());
            } catch (IOException e) {
                return HttpResponse.serverError(e.getMessage());
            }
            //TODO: upload generated files from key proof to object storage
            return HttpResponse.ok(parser.toJsonString(formula));
        } catch (JsonProcessingException e) {
            return HttpResponse.serverError(Problem.PARSING_ERROR(e.getMessage()));
        }
    }

    @Get(uri = "/jobs/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> getJobs(long id) {
        //TODO: Websocket
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }
}
