package edu.kit.cbc.editor;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.projects.files.controller.FilesController;
import jakarta.inject.Singleton;
import java.io.IOException;
import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.logging.Logger;

@Singleton
public class VerificationOrchestrator {
    private HashMap<UUID, VerificationJob> jobs;
    private static final Logger LOGGER = Logger.getGlobal();

    public VerificationOrchestrator() {
        jobs = new HashMap<>();
    }

    public UUID addJob(Optional<String> projectId, CbCFormula formula, FilesController filesController) throws IOException {
        UUID jobId = UUID.randomUUID();

        VerificationJob job = new VerificationJob(projectId, formula, filesController, () -> deleteJob(jobId));
        jobs.put(jobId, job);
        job.start();
        LOGGER.info(String.format("New verification started with job id: %s", jobId));
        return jobId;
    }

    public CbCFormula getVerificationResult(UUID jobId) {
        if (!jobs.containsKey(jobId)) {
            return null;
        }
        if (!jobs.get(jobId).isHasResult()) {
            return null;
        }
        return jobs.get(jobId).getFormula();
    }

    public void deleteJob(UUID jobId) {
        jobs.remove(jobId);
        LOGGER.info(String.format("job %s removed", jobId));
    }

    public String getJobLog(UUID jobId) {
        return jobs.get(jobId).getLog();
    }

    public boolean addListener(UUID jobId, Function<String, Boolean> callback) {
        if (!jobs.containsKey(jobId)) {
            return false;
        }
        jobs.get(jobId).addListener(callback);
        return true;
    }
}
