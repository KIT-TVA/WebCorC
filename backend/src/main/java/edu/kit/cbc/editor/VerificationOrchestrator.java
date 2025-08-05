package edu.kit.cbc.editor;

import jakarta.inject.Singleton;
import java.util.HashMap;
import java.util.UUID;
import java.util.function.Function;

@Singleton
public class VerificationOrchestrator {
    private HashMap<UUID, VerificationJob> jobs;

    public VerificationOrchestrator() {
        jobs = new HashMap<>();
    }

    public UUID addJob() {
        UUID jobId = UUID.randomUUID();
        jobs.put(jobId, new VerificationJob());
        return jobId;
    }

    public void deleteJob(UUID jobId) {
        jobs.remove(jobId);
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

    public void log(UUID jobId, String message) {
        jobs.get(jobId).log(message);
    }
}
