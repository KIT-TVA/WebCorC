package edu.kit.cbc.editor;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import com.fasterxml.jackson.core.JsonProcessingException;

import edu.kit.cbc.common.CbCFormulaContainer;
import edu.kit.cbc.common.Problem;
import edu.kit.cbc.common.corc.VerifyAllStatements;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Produces;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;


@Controller("/editor")
@ExecuteOn(TaskExecutors.BLOCKING)
public class EditorController {

    private final FormulaParser parser;

    EditorController(FormulaParser parser) {
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
            return HttpResponse.ok(parser.toJsonString(c.cbCFormula(), c.javaVariables(), c.globalConditions(), c.renaming()));
        } catch (IOException e) {
            return HttpResponse.serverError(Problem.PARSING_ERROR(e.getMessage()));
        }
    }

    @Post(uri = "/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> verify(@Body String cbcFormulaString) {
        try {
            CbCFormulaContainer formula = parser.fromJsonStringToCbC(cbcFormulaString);
            try {
                Path p = Files.createTempDirectory("proof");
                VerifyAllStatements.verify(formula.cbCFormula(), formula.javaVariables(), formula.globalConditions(), formula.renaming(), p.toUri());
            } catch (IOException e) {
                return HttpResponse.serverError(e.getMessage());
            }
            //TODO: upload generated files from key proof to object storage
            return HttpResponse.ok(parser.toJsonString(formula.cbCFormula(), formula.javaVariables(), formula.globalConditions(), formula.renaming()));
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
