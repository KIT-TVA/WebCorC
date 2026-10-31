package edu.kit.cbc.editor.verifier;

/**
 * <em>Unreachable</em>: the Verifier could not be talked to — connection failure, timeout, or a
 * 5xx answer. Transient by nature, so this is the one failure a startup retry applies to.
 */
public final class VerifierUnreachableException extends VerifierClientException {

    public VerifierUnreachableException(String message, Throwable cause) {
        super(message, cause);
    }
}
