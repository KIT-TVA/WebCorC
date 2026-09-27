package edu.kit.ifbc.editor;

import edu.kit.cbc.common.Problem;
import edu.kit.ifbc.common.ifbcmodel.IFbCFormula;
import edu.kit.ifbc.common.ifbcmodel.confidentiality.ConfidentialityLattice;
import edu.kit.cbc.projects.ProjectService;
import edu.kit.cbc.projects.files.controller.FilesController;
import io.micronaut.core.convert.ArgumentConversionContext;
import io.micronaut.core.type.Argument;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.QueryValue;
import io.micronaut.http.bind.binders.TypedRequestArgumentBinder;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.inject.Singleton;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Logger;

@Controller("/ifbc/editor")
@ExecuteOn(TaskExecutors.BLOCKING)
public class EditorController {

    private static final Logger LOGGER = Logger.getGlobal();
    private final FilesController filesController;
    private final VerificationOrchestrator orchestrator;

    EditorController(
        ProjectService projectService, 
        FilesController filesController, 
        VerificationOrchestrator orchestrator
    ) {
        this.filesController = filesController;
        this.orchestrator = orchestrator;
    }


    @Post(uri = "/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> verify(@QueryValue Optional<String> projectId, @Body IFbCFormula formula) throws IOException {
        UUID jobId = orchestrator.addJob(projectId, formula, filesController);
        return HttpResponse.ok(jobId);
    }

    @Get(uri = "/jobs/{jobId}")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<?> getJobs(@QueryValue UUID jobId) {
        IFbCFormula result = orchestrator.getVerificationResult(jobId);
        if (result == null) {
            return HttpResponse.serverError(Problem.JOB_NOT_FINISHED);
        } else {
            return HttpResponse.ok(result);
        }
    }

    @Singleton
    public static class ConfidentialityLatticeBinder implements TypedRequestArgumentBinder<ConfidentialityLattice> {
        @Override
        public Argument<ConfidentialityLattice> argumentType() {
            return Argument.of(ConfidentialityLattice.class);
        }

        @Override
        public BindingResult<ConfidentialityLattice> bind(ArgumentConversionContext<ConfidentialityLattice> context, HttpRequest<?> source) {
            Optional<ConfidentialityLattice> attribute = source.getAttribute(ConfidentialityLattice.class.getName(), ConfidentialityLattice.class);
            return () -> attribute;
        }
    }
}
