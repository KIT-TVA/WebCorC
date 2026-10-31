package edu.kit.cbc.editor.verifier;

/**
 * <em>Invalid response</em>: the Verifier answered, but not as the Verifier API promises for
 * the operation — a non-JSON body, JSON of another shape, a status-stream message that is not
 * the typed envelope, or a non-5xx error status such as 404 for a URL that does not serve the
 * Verifier API. Not retried: the Verifier (or its Registry entry) is misconfigured and needs an
 * operator.
 */
public final class InvalidVerifierResponseException extends VerifierClientException {

    public InvalidVerifierResponseException(String message, Throwable cause) {
        super(message, cause);
    }
}
