package edu.kit.cbc.editor.verifier;

import edu.kit.cbc.editor.verifier.job.StartJobRequest;
import edu.kit.cbc.editor.verifier.job.StatementResult;
import edu.kit.cbc.editor.verifier.job.StatusMessage;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;

/**
 * The only component that speaks to Verifiers over the Verifier API. Callers address a Verifier
 * by its Registry id only; the client resolves the URL through the {@link VerifierRegistry},
 * appends the operation path, and hands back typed results. No other backend code holds or
 * builds a Verifier URL.
 *
 * <p>Every operation blocks the calling thread and classifies its failure via
 * {@link VerifierClientException}'s two kinds; an id no Verifier is registered under is
 * instead an {@link IllegalArgumentException} — a programming error, never a Verifier's
 * fault.
 *
 * <p>A verification job against one Verifier is the three job operations in order, all
 * addressed by the job id the backend minted — the Verifier never mints one: {@link #startJob},
 * then {@link #streamStatus} until its done message, then {@link #fetchResult}.
 *
 * <p>Production implementation: {@link HttpVerifierClient}.
 */
public interface VerifierClient {

    /**
     * Fetches the Verifier's Self-Description ({@code GET <url>/description}).
     *
     * @param id the Verifier's Registry id
     * @return what the Verifier declares about itself
     * @throws VerifierUnreachableException if the Verifier is unreachable
     * @throws InvalidVerifierResponseException if the response does not parse to the
     *     Self-Description schema
     * @throws IllegalArgumentException if no Verifier is registered under {@code id}
     */
    SelfDescription describe(String id) throws VerifierUnreachableException, InvalidVerifierResponseException;

    /**
     * Starts a job ({@code POST <url>/jobs/{jobId}}) and returns once the Verifier has
     * acknowledged it. The acknowledgement carries nothing; everything that follows is addressed
     * by the same {@code jobId}.
     *
     * @param id the Verifier's Registry id
     * @param jobId the backend-minted job id, used verbatim on the wire
     * @param request the narrowed program with this Verifier's own conditions, the project's
     *     files and this Verifier's resolved Settings
     * @throws VerifierUnreachableException if the Verifier is unreachable
     * @throws InvalidVerifierResponseException if the Verifier refused the request
     * @throws IllegalArgumentException if no Verifier is registered under {@code id}
     */
    void startJob(String id, UUID jobId, StartJobRequest request)
        throws VerifierUnreachableException, InvalidVerifierResponseException;

    /**
     * Opens the job's status stream ({@code GET <url>/jobs/{jobId}} as a WebSocket): each log
     * message is handed to {@code onLog}, on the calling thread, in the order received. The
     * client closes the stream once the Verifier's done message arrives; whether the Verifier
     * closes it too is not waited for. There is no timeout — a Verifier that neither sends done
     * nor closes keeps the caller waiting.
     *
     * @param id the Verifier's Registry id
     * @param jobId the job id the job was started under
     * @param onLog receives each log message as it arrives
     * @return the done message, with the Verifier's aggregate verdict
     * @throws VerifierUnreachableException if the stream could not be opened, or was closed or
     *     dropped by the Verifier before it sent done
     * @throws InvalidVerifierResponseException if the Verifier refused the upgrade with a non-5xx
     *     status, or sent a message that is not a status message
     * @throws IllegalArgumentException if no Verifier is registered under {@code id}
     */
    StatusMessage.Done streamStatus(String id, UUID jobId, Consumer<StatusMessage.Log> onLog)
        throws VerifierUnreachableException, InvalidVerifierResponseException;

    /**
     * Fetches the job's result ({@code GET <url>/jobs/{jobId}/result}); meaningful only once the
     * Verifier's done message has arrived on the status stream.
     *
     * @param id the Verifier's Registry id
     * @param jobId the job id the job was started under
     * @return the Verifier's per-statement results, keyed by the string form of the statement
     *     ids of the program it was given; every entry has its {@code proven} set
     * @throws VerifierUnreachableException if the Verifier is unreachable
     * @throws InvalidVerifierResponseException if the response does not parse to the result
     *     schema
     * @throws IllegalArgumentException if no Verifier is registered under {@code id}
     */
    Map<String, StatementResult> fetchResult(String id, UUID jobId)
        throws VerifierUnreachableException, InvalidVerifierResponseException;
}
