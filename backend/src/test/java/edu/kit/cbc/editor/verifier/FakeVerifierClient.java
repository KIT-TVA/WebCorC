package edu.kit.cbc.editor.verifier;

import edu.kit.cbc.editor.verifier.job.StartJobRequest;
import edu.kit.cbc.editor.verifier.job.StatementResult;
import edu.kit.cbc.editor.verifier.job.StatusMessage;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.function.Consumer;

/**
 * A scripted {@link VerifierClient} for tests that drive the Catalog service or the
 * verification fan-out without a Verifier. Self-Descriptions or failures are canned per id, and
 * so is a verification run: the start acknowledged or refused, the status stream's message
 * sequence, the result or its failure. Records what was asked for.
 *
 * <p>Holds the caller to the contract's order per Verifier and job id — a stream for a job that
 * was never started, or a result fetched before that job's done, is an {@link AssertionError}
 * (the mock Verifier container answers 409 to the latter). A script without a done message ends
 * like a stream the Verifier closed too early: {@link VerifierUnreachableException} after the
 * logs were delivered, as the real client does.
 *
 * <p>Safe to drive from several threads at once, one job per thread, the way the fan-out runs.
 */
public class FakeVerifierClient implements VerifierClient {

    /** One acknowledged start-a-job call, as recorded. */
    public record StartedJob(String id, UUID jobId, StartJobRequest request) {}

    private record Job(String id, UUID jobId) {}

    private final Map<String, SelfDescription> descriptions = new HashMap<>();
    private final Map<String, VerifierClientException> alwaysFailing = new HashMap<>();
    private final Map<String, Deque<VerifierClientException>> failingFirst = new HashMap<>();
    private final List<String> describedIds = new CopyOnWriteArrayList<>();

    private final Map<String, VerifierClientException> startFailures = new HashMap<>();
    private final Map<String, VerifierClientException> streamFailures = new HashMap<>();
    private final Map<String, List<StatusMessage>> scripts = new HashMap<>();
    private final Map<String, CountDownLatch> doneGates = new HashMap<>();
    private final Map<String, Map<String, StatementResult>> results = new HashMap<>();
    private final Map<String, VerifierClientException> resultFailures = new HashMap<>();
    private final List<StartedJob> startedJobs = new CopyOnWriteArrayList<>();
    private final Set<Job> started = new HashSet<>();
    private final Set<Job> done = new HashSet<>();

    // --- Self-Description ---------------------------------------------------------------------

    public FakeVerifierClient describing(String id, SelfDescription description) {
        descriptions.put(id, description);
        return this;
    }

    /** Every {@code describe} call for {@code id} fails with {@code failure}. */
    public FakeVerifierClient failing(String id, VerifierClientException failure) {
        alwaysFailing.put(id, failure);
        return this;
    }

    /** The next {@code times} {@code describe} calls for {@code id} fail with {@code failure}, later ones answer. */
    public FakeVerifierClient failingFirst(int times, String id, VerifierClientException failure) {
        Deque<VerifierClientException> queue = new ArrayDeque<>();
        for (int i = 0; i < times; i++) {
            queue.add(failure);
        }
        failingFirst.put(id, queue);
        return this;
    }

    @Override
    public SelfDescription describe(String id) throws VerifierUnreachableException, InvalidVerifierResponseException {
        describedIds.add(id);
        VerifierClientException failure = alwaysFailing.get(id);
        if (failure == null && failingFirst.containsKey(id)) {
            failure = failingFirst.get(id).poll();
        }
        throwIfScripted(failure);
        SelfDescription description = descriptions.get(id);
        if (description == null) {
            throw new AssertionError("Unexpected describe(" + id + ")");
        }
        return description;
    }

    /** Every id {@code describe} was called for, in call order, with repeats. */
    public List<String> describedIds() {
        return describedIds;
    }

    /** How often {@code describe} was called for {@code id}. */
    public long calls(String id) {
        return describedIds.stream().filter(id::equals).count();
    }

    // --- Verification run ---------------------------------------------------------------------

    /**
     * Scripts a run of {@code id}: the start is acknowledged, the status stream plays
     * {@code script} (log messages, then one done), and the result is {@code result}.
     */
    public FakeVerifierClient running(String id, Map<String, StatementResult> result, StatusMessage... script) {
        scripts.put(id, List.of(script));
        results.put(id, result);
        return this;
    }

    /** Every start of {@code id} fails with {@code failure}; nothing else may be called for it. */
    public FakeVerifierClient failingToStart(String id, VerifierClientException failure) {
        startFailures.put(id, failure);
        return this;
    }

    /** The start of {@code id} is acknowledged, but opening its status stream fails with {@code failure}. */
    public FakeVerifierClient failingToStream(String id, VerifierClientException failure) {
        streamFailures.put(id, failure);
        return this;
    }

    /** The run of {@code id} plays {@code script}, but fetching its result fails with {@code failure}. */
    public FakeVerifierClient failingResult(String id, VerifierClientException failure, StatusMessage... script) {
        scripts.put(id, List.of(script));
        resultFailures.put(id, failure);
        return this;
    }

    /**
     * The status stream of {@code id} delivers its logs, then waits for {@code gate} before
     * returning done — for tests of what happens while a Verifier is still running.
     */
    public FakeVerifierClient holdingDone(String id, CountDownLatch gate) {
        doneGates.put(id, gate);
        return this;
    }

    /** Every acknowledged start, in call order. */
    public List<StartedJob> startedJobs() {
        return startedJobs;
    }

    @Override
    public void startJob(String id, UUID jobId, StartJobRequest request)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        throwIfScripted(startFailures.get(id));
        if (!scripts.containsKey(id) && !streamFailures.containsKey(id)) {
            throw new AssertionError("Unexpected startJob(" + id + ", " + jobId + "): no run scripted");
        }
        synchronized (this) {
            started.add(new Job(id, jobId));
        }
        startedJobs.add(new StartedJob(id, jobId, request));
    }

    @Override
    public StatusMessage.Done streamStatus(String id, UUID jobId, Consumer<StatusMessage.Log> onLog)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        Job job = new Job(id, jobId);
        synchronized (this) {
            if (!started.contains(job)) {
                throw new AssertionError("streamStatus(" + id + ", " + jobId + ") for a job that was not started");
            }
        }
        throwIfScripted(streamFailures.get(id));
        List<StatusMessage> script = scripts.get(id);
        if (script == null) {
            throw new AssertionError("Unexpected streamStatus(" + id + ", " + jobId + "): no run scripted");
        }
        for (StatusMessage message : script) {
            switch (message) {
                case StatusMessage.Log log -> onLog.accept(log);
                case StatusMessage.Done finished -> {
                    awaitGate(id, jobId);
                    synchronized (this) {
                        done.add(job);
                    }
                    return finished;
                }
            }
        }
        throw new VerifierUnreachableException(
            "Verifier '" + id + "' closed the status stream of " + jobId + " before sending done", null);
    }

    @Override
    public Map<String, StatementResult> fetchResult(String id, UUID jobId)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        synchronized (this) {
            if (!done.contains(new Job(id, jobId))) {
                throw new AssertionError("fetchResult(" + id + ", " + jobId + ") before that job's done arrived");
            }
        }
        throwIfScripted(resultFailures.get(id));
        Map<String, StatementResult> result = results.get(id);
        if (result == null) {
            throw new AssertionError("Unexpected fetchResult(" + id + ", " + jobId + "): no result scripted");
        }
        return result;
    }

    private void awaitGate(String id, UUID jobId) throws VerifierUnreachableException {
        CountDownLatch gate = doneGates.get(id);
        if (gate == null) {
            return;
        }
        try {
            gate.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new VerifierUnreachableException("Interrupted while holding done of " + id + "/" + jobId, e);
        }
    }

    private static void throwIfScripted(VerifierClientException failure)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        switch (failure) {
            case VerifierUnreachableException unreachable -> throw unreachable;
            case InvalidVerifierResponseException invalid -> throw invalid;
            case null -> { }
        }
    }
}
