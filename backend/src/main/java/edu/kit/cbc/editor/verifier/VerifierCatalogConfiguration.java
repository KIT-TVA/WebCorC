package edu.kit.cbc.editor.verifier;

import io.micronaut.context.annotation.ConfigurationProperties;
import java.time.Duration;

/**
 * How the Verifier Catalog's startup fetch treats a Verifier that cannot be reached: bound from
 * {@code verifier-catalog} in the backend configuration, next to the Verifier Registry
 * ({@code verifiers}) in the deployment's Registry file.
 *
 * <p>Retry applies to <em>unreachable</em> Verifiers only (connect failure, timeout, 5xx) — the
 * transient failures of a container start-order race. An <em>invalid</em> Self-Description is
 * never retried: the Verifier (or its Registry entry) is misconfigured and needs an operator.
 * The HTTP timeouts of each attempt are the application's {@code micronaut.http.client} ones,
 * which a deployment may override in the same Registry file.
 *
 * <p>Malformed values fail at startup, like a malformed {@link VerifierRegistry}.
 */
@ConfigurationProperties(VerifierCatalogConfiguration.PREFIX)
public class VerifierCatalogConfiguration {

    public static final String PREFIX = "verifier-catalog";

    /** Default number of retries after the first failed attempt. */
    public static final int DEFAULT_RETRIES = 3;

    /** Default pause between two attempts. */
    public static final Duration DEFAULT_RETRY_DELAY = Duration.ofSeconds(10);

    private int retries = DEFAULT_RETRIES;
    private Duration retryDelay = DEFAULT_RETRY_DELAY;

    /** How many times an unreachable Verifier is asked again after the first failed attempt. */
    public int getRetries() {
        return retries;
    }

    public void setRetries(int retries) {
        if (retries < 0) {
            throw new IllegalStateException(PREFIX + ".retries must not be negative: " + retries);
        }
        this.retries = retries;
    }

    /** The pause between two attempts. */
    public Duration getRetryDelay() {
        return retryDelay;
    }

    public void setRetryDelay(Duration retryDelay) {
        if (retryDelay == null || retryDelay.isNegative()) {
            throw new IllegalStateException(PREFIX + ".retry-delay must be a non-negative duration: " + retryDelay);
        }
        this.retryDelay = retryDelay;
    }
}
