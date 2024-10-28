package edu.kit.cbc.editor;

import com.fasterxml.jackson.core.JsonProcessingException;

import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.Problem;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Produces;

@Controller("/editor")
public class EditorController {

    private final CbcFormulaParser parser;

    EditorController(CbcFormulaParser parser) {
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

    @Post(uri = "/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> verify(@Body String cbcFormulaString) {
        try {
            CbCFormula formula = parser.fromJsonString(cbcFormulaString);
            //TODO: perform actual verification procedure
            //currently the proven state is just inverted for demo purposes
            formula.setProven(!formula.isProven());
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
