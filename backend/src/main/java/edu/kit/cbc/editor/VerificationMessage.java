package edu.kit.cbc.editor;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.micronaut.serde.annotation.Serdeable;

/**
 * One message on the frontend-facing verification WebSocket, mirroring
 * {@code openapi/schema/verification/message.yml}: the three types flattened into one record
 * the way {@link edu.kit.cbc.editor.verifier.job.JobStatement} flattens the statement kinds —
 * fields a type does not carry are {@code null} and omitted. {@code verifier} is {@code func}
 * for functional verification. {@code durationMs} is that Verifier's wall-clock run time on
 * {@code done}, or the whole job's wall-clock run time on {@code complete}; it stays {@code null}
 * (and so is omitted) only for {@code log}.
 */
@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
public record VerificationMessage(String type, String verifier, String message, Boolean proven, Long durationMs) {

    public static final String LOG = "log";
    public static final String DONE = "done";
    public static final String COMPLETE = "complete";

    public static VerificationMessage log(String verifier, String message) {
        return new VerificationMessage(LOG, verifier, message, null, null);
    }

    public static VerificationMessage done(String verifier, boolean proven, long durationMs) {
        return new VerificationMessage(DONE, verifier, null, proven, durationMs);
    }

    public static VerificationMessage complete(long durationMs) {
        return new VerificationMessage(COMPLETE, null, null, null, durationMs);
    }
}
