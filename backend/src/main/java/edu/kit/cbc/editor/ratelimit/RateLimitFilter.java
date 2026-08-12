package edu.kit.cbc.editor.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.RequestFilter;
import io.micronaut.http.annotation.ServerFilter;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

@ServerFilter("/editor/askquestion")
public class RateLimitFilter {

    private static final Logger LOGGER = Logger.getGlobal();
    private final RateLimitConfiguration config;
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lastAccess = new ConcurrentHashMap<>();

    public RateLimitFilter(RateLimitConfiguration config) {
        this.config = config;
    }

    @RequestFilter
    public Optional<HttpResponse<?>> filterRequest(HttpRequest<?> request) {
        if (!config.isEnabled()) {
            return Optional.empty();
        }

        String clientIp = resolveClientIp(request);
        lastAccess.put(clientIp, System.currentTimeMillis());
        Bucket bucket = buckets.computeIfAbsent(clientIp, ip -> createBucket());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return Optional.empty();
        }

        long waitSeconds = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()) + 1;
        LOGGER.warning(String.format("Rate limit exceeded for IP %s. Retry-After: %d seconds.", clientIp, waitSeconds));

        return Optional.of(
                HttpResponse.status(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Retry-After", String.valueOf(waitSeconds))
                        .body(Map.<String, Object>of(
                                "type", "about:blank",
                                "title", "Rate limit exceeded",
                                "status", 429,
                                "detail", "Too many requests. Please try again later.",
                                "instance", "about:blank"
                        ))
        );
    }

    public void removeStaleEntries() {
        long cutoff = System.currentTimeMillis() - Duration.ofHours(2).toMillis();
        lastAccess.entrySet().removeIf(entry -> {
            if (entry.getValue() < cutoff) {
                buckets.remove(entry.getKey());
                return true;
            }
            return false;
        });
    }

    private String resolveClientIp(HttpRequest<?> request) {
        if (config.isTrustForwardedHeaders()) {
            String forwarded = request.getHeaders().get("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
        }
        return request.getRemoteAddress().getAddress().getHostAddress();
    }

    private Bucket createBucket() {
        Bandwidth perMinute = Bandwidth.builder()
                .capacity(config.getRequestsPerMinute())
                .refillIntervally(config.getRequestsPerMinute(), Duration.ofMinutes(1))
                .build();
        Bandwidth perHour = Bandwidth.builder()
                .capacity(config.getRequestsPerHour())
                .refillIntervally(config.getRequestsPerHour(), Duration.ofHours(1))
                .build();
        return Bucket.builder()
                .addLimit(perMinute)
                .addLimit(perHour)
                .build();
    }
}
