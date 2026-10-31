package edu.kit.cbc.editor.verifier;

/**
 * A failure of a {@link VerifierClient} operation. Exactly two kinds exist, and callers are
 * expected to tell them apart: {@link VerifierUnreachableException} (the Verifier could not be
 * talked to — retryable) and {@link InvalidVerifierResponseException} (the Verifier answered,
 * but not as the Verifier API promises — not retryable).
 */
public abstract sealed class VerifierClientException extends Exception
    permits VerifierUnreachableException, InvalidVerifierResponseException {

    protected VerifierClientException(String message, Throwable cause) {
        super(message, cause);
    }
}
