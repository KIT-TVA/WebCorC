package edu.kit.cbc.editor;

import edu.kit.cbc.common.Problem;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.codegeneration.CodeGenerator;
import edu.kit.cbc.editor.llm.LLMClientRegistry;
import edu.kit.cbc.editor.llm.LLMQueryDto;
import edu.kit.cbc.editor.llm.LLMResponse;
import edu.kit.cbc.projects.files.controller.FilesController;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.QueryValue;
import io.micronaut.http.client.exceptions.HttpClientResponseException;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Logger;

@Controller("/editor")
@ExecuteOn(TaskExecutors.BLOCKING)
public class EditorController {

    // #region agent log
    private static final Logger LOGGER = Logger.getGlobal();
    // #endregion
    private final FilesController filesController;
    private final LLMClientRegistry llmRegistry;
    private final VerificationOrchestrator orchestrator;

    EditorController(FilesController filesController, LLMClientRegistry llmRegistry, VerificationOrchestrator orchestrator) {
        this.filesController = filesController;
        this.llmRegistry = llmRegistry;
        this.orchestrator = orchestrator;
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
    public HttpResponse<String> generate(@Body @Valid CbCFormula formula) {
        return HttpResponse.ok(CodeGenerator.generate(formula));
    }

    @Post(uri = "/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> verify(@QueryValue Optional<String> projectId, @Body @Valid CbCFormula formula) throws IOException {
        UUID jobId = orchestrator.addJob(projectId, formula, filesController);
        return HttpResponse.ok(jobId);
    }


    @Post(uri = "/javaGen")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> javaGen(@QueryValue Optional<String> projectId, @Body CbCFormula cbcFormula) {
        return HttpResponse.ok(CodeGenerator.generate(cbcFormula));
    }

    @Get(uri = "/jobs/{jobId}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<?> getJobs(@QueryValue UUID jobId) {
        CbCFormula result = orchestrator.getVerificationResult(jobId);
        if (result == null) {
            return HttpResponse.serverError(Problem.JOB_NOT_FINISHED);
        } else {
            return HttpResponse.ok(result);
        }
    }

    @Post(uri = "/askquestion")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> askQuestion(@Body @Valid LLMQueryDto query) {
        // #region agent log
        try {
            LLMResponse result = llmRegistry.getClient(query.provider()).sendQuery(query);
            LOGGER.info("askQuestion succeeded, returning 200");
            return HttpResponse.ok(result);
        } catch (HttpClientResponseException e) {
            String body = e.getResponse().getBody(String.class).orElse("no body");
            LOGGER.severe(String.format("askQuestion caught HttpClientResponseException, forwarding to client. Status=%d, Body=%s",
                e.getStatus().getCode(), body));
            return HttpResponse.status(HttpStatus.valueOf(e.getStatus().getCode())).body(body);
        } catch (Exception e) {
            LOGGER.severe(String.format("askQuestion caught unexpected exception: %s: %s",
                e.getClass().getSimpleName(), e.getMessage()));
            return HttpResponse.serverError(e.getMessage());
        }
        // #endregion
    }
}
