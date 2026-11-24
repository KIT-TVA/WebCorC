package edu.kit.cbc.editor.ratelimit;

import io.micronaut.scheduling.annotation.Scheduled;
import jakarta.inject.Singleton;

@Singleton
public class RateLimitCleanupTask {

    private final RateLimitFilter rateLimitFilter;

    public RateLimitCleanupTask(RateLimitFilter rateLimitFilter) {
        this.rateLimitFilter = rateLimitFilter;
    }

    @Scheduled(fixedDelay = "1h")
    public void cleanupStaleBuckets() {
        rateLimitFilter.removeStaleEntries();
    }
}
