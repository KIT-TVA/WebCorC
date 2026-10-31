package edu.kit.cbc.editor;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.editor.verifier.VerifierCatalogService;
import edu.kit.cbc.projects.files.controller.FilesController;
import jakarta.inject.Singleton;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.logging.Logger;

/**
 * Mints job ids and keeps the running and recently finished {@link VerificationJob}s; the one
 * job id addresses the frontend-facing WebSocket, the result fetch and — reused verbatim —
 * every Verifier the job fans out to.
 */
@Singleton
public class VerificationOrchestrator {
    private final Map<UUID, VerificationJob> jobs = new ConcurrentHashMap<>();
    private final VerifierFanOut fanOut;
    private final VerifierCatalogService catalogService;
    private static final Logger LOGGER = Logger.getGlobal();

    public VerificationOrchestrator(VerifierFanOut fanOut, VerifierCatalogService catalogService) {
        this.fanOut = fanOut;
        this.catalogService = catalogService;
    }

    public UUID addJob(Optional<String> projectId, boolean functionalOnly, CbCFormula formula, FilesController filesController) throws IOException {
        UUID jobId = UUID.randomUUID();

        VerificationJob job = new VerificationJob(jobId, projectId, functionalOnly, formula, filesController,
            fanOut, catalogService.catalog(), () -> deleteJob(jobId));
        jobs.put(jobId, job);
        job.start();
        LOGGER.info(String.format("New verification started with job id: %s", jobId));
        return jobId;
    }

    /** The job's formula with every result merged in, or {@code null} until the job is complete (or once it is forgotten). */
    public CbCFormula getVerificationResult(UUID jobId) {
        VerificationJob job = jobs.get(jobId);
        if (job == null || !job.isHasResult()) {
            return null;
        }
        return job.getFormula();
    }

    public void deleteJob(UUID jobId) {
        jobs.remove(jobId);
        LOGGER.info(String.format("job %s removed", jobId));
    }

    /**
     * Subscribes {@code listener} to the job's messages, history first (see
     * {@link VerificationJob#subscribe}); {@code false} if there is no such job.
     */
    public boolean subscribe(UUID jobId, Function<VerificationMessage, Boolean> listener) {
        VerificationJob job = jobs.get(jobId);
        if (job == null) {
            return false;
        }
        job.subscribe(listener);
        return true;
    }
}
