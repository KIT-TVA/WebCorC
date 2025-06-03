package edu.kit.cbc.editor;

import com.fasterxml.jackson.core.JsonProcessingException;
import edu.kit.cbc.common.Problem;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.proof.KeYProof;
import edu.kit.cbc.common.corc.proof.KeYProofGenerator;
import edu.kit.cbc.editor.llm.LLMQueryDto;
import edu.kit.cbc.editor.llm.LLMResponse;
import edu.kit.cbc.editor.llm.OpenAIClient;
import edu.kit.cbc.projects.files.controller.FilesController;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.QueryValue;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.validation.Valid;
import java.util.Optional;

@Controller("/editor")
@ExecuteOn(TaskExecutors.BLOCKING)
public class EditorController {

    private final FilesController filesController;
    private final FormulaParser parser;
    private final OpenAIClient openai;

    EditorController(FilesController filesController, FormulaParser parser, OpenAIClient openai) {
        this.filesController = filesController;
        this.parser = parser;
        this.openai = openai;
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
        return HttpResponse.serverError("NOT IMPLEMENTED ");
    }

    @Post(uri = "/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> verify(@QueryValue Optional<String> projectId, @Body @Valid CbCFormula formula) {
        try {

            KeYProofGenerator generator = new KeYProofGenerator(formula);
            KeYProof proof = generator.generate(formula.getStatement());
            System.out.println(proof);

            return HttpResponse.ok(parser.toJsonString(formula));
        } catch (JsonProcessingException e) {
            return HttpResponse.serverError(Problem.getParsingError(e.getMessage()));
        }
    }

    @Post(uri = "/javaGen")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> javaGen(@QueryValue Optional<String> projectId, @Body String cbcFormulaString) {
        return HttpResponse.serverError("NOT IMPLEMENTED");
    }

    @Get(uri = "/jobs/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<String> getJobs(long id) {
        // TODO: Websocket
        return HttpResponse.serverError(String.format("NOT IMPLEMENTED %d", id));
    }

    @Post(uri = "/askquestion")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<LLMResponse> askQuestion(@Body @Valid LLMQueryDto query) {
        return HttpResponse.ok(openai.sendQuery(query));
    }
}
