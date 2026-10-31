package edu.kit.cbc.editor.verifier;

import edu.kit.cbc.editor.verifier.job.JobProgram;
import edu.kit.cbc.editor.verifier.job.JobStatement;
import edu.kit.cbc.editor.verifier.job.StartJobRequest;
import edu.kit.cbc.editor.verifier.job.StatementResult;
import edu.kit.cbc.editor.verifier.job.StatusMessage;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * The scripted job behaviours of {@link FakeVerifierClient}, which the fan-out orchestration
 * tests build on: a run plays its script in the contract's order, failures are thrown where
 * scripted, and a caller breaking the order (result before done) fails the test rather than
 * passing by accident — the same guard the mock Verifier container has.
 */
class FakeVerifierClientTest {

    private static final UUID JOB = UUID.randomUUID();
    private static final StartJobRequest REQUEST = new StartJobRequest(
        new JobProgram("demo", List.of(), null, null, JobStatement.skip(0, "root", null, null)),
        List.of(), Map.of());
    private static final Map<String, StatementResult> RESULT = Map.of("0", new StatementResult(true, "ok"));
    private static final VerifierUnreachableException UNREACHABLE = new VerifierUnreachableException("down", null);
    private static final InvalidVerifierResponseException INVALID = new InvalidVerifierResponseException("400", null);

    @Test
    void playsAScriptedRunInTheContractsOrder() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .running("eebc", RESULT, new StatusMessage.Log("a"), new StatusMessage.Log("b"), new StatusMessage.Done(true, null));
        List<String> logs = new ArrayList<>();

        client.startJob("eebc", JOB, REQUEST);
        StatusMessage.Done done = client.streamStatus("eebc", JOB, log -> logs.add(log.message()));
        Map<String, StatementResult> result = client.fetchResult("eebc", JOB);

        Assertions.assertEquals(List.of(new FakeVerifierClient.StartedJob("eebc", JOB, REQUEST)), client.startedJobs());
        Assertions.assertEquals(List.of("a", "b"), logs);
        Assertions.assertEquals(new StatusMessage.Done(true, null), done);
        Assertions.assertEquals(RESULT, result);
    }

    @Test
    void failsToStartAsScriptedAndRefusesTheRestOfTheRun() {
        FakeVerifierClient client = new FakeVerifierClient().failingToStart("eebc", UNREACHABLE);

        VerifierUnreachableException e = Assertions.assertThrows(VerifierUnreachableException.class,
            () -> client.startJob("eebc", JOB, REQUEST));

        Assertions.assertSame(UNREACHABLE, e);
        Assertions.assertTrue(client.startedJobs().isEmpty(), "A refused start is not a started job");
        Assertions.assertThrows(AssertionError.class, () -> client.streamStatus("eebc", JOB, log -> { }),
            "Streaming a job that never started is a caller bug");
    }

    @Test
    void failsToStreamAsScripted() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient().failingToStream("eebc", UNREACHABLE);

        client.startJob("eebc", JOB, REQUEST);

        Assertions.assertSame(UNREACHABLE, Assertions.assertThrows(VerifierUnreachableException.class,
            () -> client.streamStatus("eebc", JOB, log -> { })));
        Assertions.assertThrows(AssertionError.class, () -> client.fetchResult("eebc", JOB),
            "No done, no result");
    }

    @Test
    void failsTheResultAsScriptedOnceDoneArrived() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .failingResult("eebc", INVALID, new StatusMessage.Done(false, null));

        client.startJob("eebc", JOB, REQUEST);
        StatusMessage.Done done = client.streamStatus("eebc", JOB, log -> { });

        Assertions.assertEquals(new StatusMessage.Done(false, null), done);
        Assertions.assertSame(INVALID, Assertions.assertThrows(InvalidVerifierResponseException.class,
            () -> client.fetchResult("eebc", JOB)));
    }

    @Test
    void resultBeforeDoneIsACallerBug() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient().running("eebc", RESULT, new StatusMessage.Done(true, null));

        client.startJob("eebc", JOB, REQUEST);

        Assertions.assertThrows(AssertionError.class, () -> client.fetchResult("eebc", JOB));
    }

    @Test
    void scriptWithoutDoneIsAStreamClosedTooEarly() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient().running("eebc", RESULT, new StatusMessage.Log("only"));
        List<String> logs = new ArrayList<>();

        client.startJob("eebc", JOB, REQUEST);

        Assertions.assertThrows(VerifierUnreachableException.class,
            () -> client.streamStatus("eebc", JOB, log -> logs.add(log.message())));
        Assertions.assertEquals(List.of("only"), logs, "Delivered up to the close, like the real client");
    }

    @Test
    void jobsAreKeptApartByVerifierAndJobId() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .running("eebc", RESULT, new StatusMessage.Done(true, null))
            .running("sec", Map.of(), new StatusMessage.Done(false, null));
        UUID other = UUID.randomUUID();

        client.startJob("eebc", JOB, REQUEST);
        client.startJob("sec", JOB, REQUEST);
        client.streamStatus("eebc", JOB, log -> { });

        Assertions.assertEquals(RESULT, client.fetchResult("eebc", JOB));
        Assertions.assertThrows(AssertionError.class, () -> client.fetchResult("sec", JOB), "sec has not sent done");
        Assertions.assertThrows(AssertionError.class, () -> client.streamStatus("eebc", other, log -> { }),
            "Another job id was never started");
    }

    @Test
    void holdsDoneUntilReleased() throws Exception {
        CountDownLatch release = new CountDownLatch(1);
        CountDownLatch logged = new CountDownLatch(1);
        FakeVerifierClient client = new FakeVerifierClient()
            .running("eebc", RESULT, new StatusMessage.Log("working"), new StatusMessage.Done(true, null))
            .holdingDone("eebc", release);
        client.startJob("eebc", JOB, REQUEST);

        CompletableFuture<StatusMessage.Done> done = CompletableFuture.supplyAsync(() -> {
            try {
                return client.streamStatus("eebc", JOB, log -> logged.countDown());
            } catch (VerifierClientException e) {
                throw new AssertionError(e);
            }
        });

        Assertions.assertTrue(logged.await(5, TimeUnit.SECONDS), "Logs are delivered before the hold");
        Assertions.assertFalse(done.isDone(), "Done is held back until the test releases it");
        release.countDown();
        Assertions.assertEquals(new StatusMessage.Done(true, null), done.get(5, TimeUnit.SECONDS));
        Assertions.assertEquals(RESULT, client.fetchResult("eebc", JOB));
    }
}
