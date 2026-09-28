package edu.kit.ifbc.editor;

import edu.kit.cbc.common.Problem;
import edu.kit.ifbc.common.ifbcmodel.IFbCFormula;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.confidentiality.ConfidentialityLattice;
import edu.kit.ifbc.common.ifbcmodel.integrity.IntegrityLattice;
import edu.kit.ifbc.editor.lattice.LatticeDTO;
import edu.kit.ifbc.editor.lattice.PartialLatticeDTO;
import edu.kit.cbc.projects.ProjectService;
import edu.kit.cbc.projects.files.controller.FilesController;
import io.micronaut.core.type.Argument;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.annotation.QueryValue;
import io.micronaut.http.server.types.files.StreamedFile;
import io.micronaut.json.JsonMapper;
import io.micronaut.objectstorage.ObjectStorageException;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.logging.Logger;

@Controller("/ifbc/editor")
@ExecuteOn(TaskExecutors.BLOCKING)
public class EditorController {

    private static final Logger LOGGER = Logger.getGlobal();
    private final FilesController filesController;
    private final VerificationOrchestrator orchestrator;
    private final JsonMapper jsonMapper;
    private final ProjectService projectService;

    EditorController(
        ProjectService projectService, 
        FilesController filesController, 
        VerificationOrchestrator orchestrator, 
        JsonMapper jsonMapper
    ) {
        this.filesController = filesController;
        this.orchestrator = orchestrator;
        this.jsonMapper = jsonMapper;
        this.projectService = projectService;
    }

    /**
     * helper method to retrieve a lattice from the given resource file.
     * If no project is given, it just returns the default lattice.
     * @param urn resource specifier
     * @param projectId 
     * @param defaultLattice supplier creating a default lattice.
     * @return HTTP response with a {@link PartialLatticeDTO} as body
     * @throws IOException
     */
    private HttpResponse<?> retrieveLattice(String urn, Optional<String> projectId, Supplier<Lattice> defaultLattice) throws IOException {
        if (projectId.isEmpty()) {
            return HttpResponse.ok(new PartialLatticeDTO(null, null, defaultLattice.get()));
        }
        if (!projectService.existsById(projectId.get())) {
            return HttpResponse.notFound(new Problem("about:blank", "Not found", 404,
                String.format("project with id %s was not found", projectId), "about:blank"));
        }
        try {
            Optional<HttpResponse<StreamedFile>> fileResponse = filesController.getFile(projectId.get(), urn);
            LOGGER.severe("resp: " + fileResponse);
            if (fileResponse.isEmpty()) {
                return HttpResponse.ok(new LatticeDTO(null, null, defaultLattice.get()));
            }
            InputStream is = fileResponse.get().body().getInputStream();
            PartialLatticeDTO dto = jsonMapper.readValue(is, Argument.of(PartialLatticeDTO.class));
            LOGGER.severe("lattice " + dto);
            return HttpResponse.ok(dto);
        } catch (ObjectStorageException exception) {
            return HttpResponse.ok(new PartialLatticeDTO(null, null, defaultLattice.get()));
        }
    }

    @Get(uri = "/lattice/confidentiality")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<?> getConfidentialityLattice(@QueryValue Optional<String> projectId) throws IOException {
        return retrieveLattice("confidentiality.lattice", projectId, ConfidentialityLattice::defaultConfidentialityLattice);
    }

    @Post(uri = "/lattice/confidentiality")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> saveConfidentialityLatticeState(
        @QueryValue Optional<String> projectId,
        HashMap<String, Integer> preVariableState,
        HashMap<String, Integer> postVariableState,
        List<Lattice.Level> levels
    ) throws IOException {
        Lattice lattice = new ConfidentialityLattice(levels);
        PartialLatticeDTO dto = new PartialLatticeDTO(
            preVariableState,
            postVariableState,
            lattice
        );
        if (projectId.isPresent()) {
            String json = jsonMapper.writeValueAsString(dto);
            filesController.uploadBytes(json.getBytes(StandardCharsets.UTF_8), projectId.get(), Path.of("confidentiality.lattice"));
        }
        return HttpResponse.ok(dto);
    }

    @Get(uri = "/lattice/integrity")
    @Produces(MediaType.APPLICATION_JSON)
    public HttpResponse<?> getIntegrityLattice(@QueryValue Optional<String> projectId) throws IOException {
        return retrieveLattice("integrity.lattice", projectId, IntegrityLattice::new);
    }

    @Post(uri = "/lattice/integrity")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> saveIntegrityLatticeState(
        @QueryValue Optional<String> projectId,
        HashMap<String, Integer> preVariableState,
        HashMap<String, Integer> postVariableState
    ) throws IOException {
        Lattice lattice = new IntegrityLattice();
        PartialLatticeDTO dto = new PartialLatticeDTO(
            preVariableState,
            postVariableState,
            lattice
        );
        if (projectId.isPresent()) {
            String json = jsonMapper.writeValueAsString(dto);
            filesController.uploadBytes(json.getBytes(StandardCharsets.UTF_8), projectId.get(), Path.of("integrity.lattice"));
        }
        return HttpResponse.ok(dto);
    }

    @Post(uri = "/lattice/validate")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public HttpResponse<?> validateLattice(
        List<Lattice.Level> levels
    ) throws IOException {
        try {
            Lattice lattice = new Lattice(levels);
            return HttpResponse.ok(lattice);
        } catch (Lattice.LatticeException exception) {
            return HttpResponse.badRequest(Map.of("error", exception.getMessage()));
        }
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
}
