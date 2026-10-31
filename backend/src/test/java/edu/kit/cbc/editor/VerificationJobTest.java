package edu.kit.cbc.editor;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.StatementType;
import edu.kit.cbc.common.corc.cbcmodel.VerifierEntry;
import edu.kit.cbc.common.corc.cbcmodel.statements.Statement;
import edu.kit.cbc.common.corc.proof.ProofContext;
import edu.kit.cbc.editor.verifier.FakeVerifierClient;
import edu.kit.cbc.editor.verifier.ResolvedVerifier;
import edu.kit.cbc.editor.verifier.Verifier;
import edu.kit.cbc.editor.verifier.VerifierCatalog;
import edu.kit.cbc.editor.verifier.VerifierCatalogService;
import edu.kit.cbc.editor.verifier.VerifierUnreachableException;
import edu.kit.cbc.editor.verifier.job.NarrowedProgram;
import edu.kit.cbc.editor.verifier.job.SourceFile;
import edu.kit.cbc.editor.verifier.job.StatementResult;
import edu.kit.cbc.editor.verifier.job.StatusMessage;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * One verification job end to end, with a stub in place of the KeY-backed statement: functional
 * verification runs first and reports its own done; only its success (and
 * {@code functionalOnly=false}) fans out to the enabled Verifiers; the final complete comes
 * exactly once, after everyone, and is what makes the result available. Late subscribers get the
 * whole history first.
 */
class VerificationJobTest {

    private static final UUID JOB = UUID.randomUUID();
    private static final String FUNC = VerifierCatalogService.FUNCTIONAL_VERIFIER_ID;
    private static final VerifierCatalog CATALOG = new VerifierCatalog(List.of(
        new Verifier(FUNC, "Functional correctness", true, false, null, List.of(), List.of(), null),
        new Verifier("mock", "Mock", true, true, null, List.of(), List.of(), null),
        new Verifier("off", "Off", false, true, null, List.of(), List.of(), null)), null);
    private static final VerifierCatalog CATALOG_NO_OTHER_VERIFIERS = new VerifierCatalog(List.of(
        new Verifier(FUNC, "Functional correctness", true, false, null, List.of(), List.of(), null),
        new Verifier("off", "Off", false, true, null, List.of(), List.of(), null)), null);

    /** Stands in for a KeY-proven leaf statement: a fixed verdict, one log line, an optional sleep to give its run a measurable duration. */
    private static final class StubStatement extends Statement {

        private final boolean verdict;
        private final long sleepMs;

        StubStatement(boolean verdict) {
            this(verdict, 0);
        }

        StubStatement(boolean verdict, long sleepMs) {
            this.verdict = verdict;
            this.sleepMs = sleepMs;
            setName("Stub");
            setType(StatementType.STATEMENT);
            setPreCondition(Condition.fromString("x == 0"));
            setPostCondition(Condition.fromString("x == 1"));
        }

        @Override
        public boolean prove(ProofContext proofContext) {
            if (sleepMs > 0) {
                try {
                    Thread.sleep(sleepMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            proofContext.getLogger().accept("proving " + getName());
            setProven(verdict);
            return verdict;
        }

        @Override
        public String generateCode() {
            return "";
        }

        @Override
        public String generateCodeForProof() {
            return "";
        }
    }

    private final List<VerificationMessage> messages = new CopyOnWriteArrayList<>();
    private final CountDownLatch completed = new CountDownLatch(1);
    private VerificationJob job;

    @AfterEach
    void stopRetainingTheResult() {
        if (job != null) {
            job.interrupt();
        }
    }

    private VerificationJob start(boolean functionalOnly, boolean functionalVerdict, FakeVerifierClient client) throws Exception {
        return start(functionalOnly, functionalVerdict, client, CATALOG);
    }

    private VerificationJob start(boolean functionalOnly, boolean functionalVerdict, FakeVerifierClient client, VerifierCatalog catalog)
        throws Exception {
        CbCFormula formula = new CbCFormula("Demo", new StubStatement(functionalVerdict), List.of(), List.of(), List.of(), null, false);
        job = new VerificationJob(JOB, Optional.empty(), functionalOnly, formula, null,
            new VerifierFanOut(client, Runnable::run), CompletableFuture.completedFuture(catalog), () -> { });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });
        job.start();
        return job;
    }

    private void awaitComplete() throws InterruptedException {
        Assertions.assertTrue(completed.await(10, TimeUnit.SECONDS), "The job never completed: " + messages);
    }

    private List<VerificationMessage> of(String verifier) {
        return messages.stream()
            .filter(message -> verifier.equals(message.verifier()))
            .map(VerificationJobTest::withoutDuration)
            .toList();
    }

    private List<String> types() {
        return messages.stream().map(VerificationMessage::type).toList();
    }

    /**
     * An expected {@code done} for equality checks: {@code durationMs} is real elapsed time, so
     * {@link #withoutDuration} strips it from what actually arrived before comparing.
     */
    private static VerificationMessage doneIgnoringDuration(String verifier, boolean proven) {
        return new VerificationMessage(VerificationMessage.DONE, verifier, null, proven, null);
    }

    /** An expected {@code complete} for equality checks, {@code durationMs} stripped like {@link #doneIgnoringDuration}. */
    private static VerificationMessage completeIgnoringDuration() {
        return new VerificationMessage(VerificationMessage.COMPLETE, null, null, null, null);
    }

    private static VerificationMessage withoutDuration(VerificationMessage message) {
        return VerificationMessage.DONE.equals(message.type()) || VerificationMessage.COMPLETE.equals(message.type())
            ? new VerificationMessage(message.type(), message.verifier(), message.message(), message.proven(), null)
            : message;
    }

    private static List<VerificationMessage> withoutDuration(List<VerificationMessage> messages) {
        return messages.stream().map(VerificationJobTest::withoutDuration).toList();
    }

    @Test
    void functionalOnlyJobReportsFunctionalDoneThenCompleteAndCallsNoVerifier() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient();

        start(true, true, client);
        awaitComplete();

        Assertions.assertEquals(VerificationMessage.log(null, "verification initialized"), messages.get(0),
            "What the constructor logged is delivered on subscribe");
        Assertions.assertTrue(messages.contains(VerificationMessage.log(FUNC, "proving Stub")), "Functional log lines are tagged func");
        List<VerificationMessage> tail = messages.subList(messages.size() - 2, messages.size());
        Assertions.assertEquals(List.of(doneIgnoringDuration(FUNC, true), completeIgnoringDuration()), withoutDuration(tail));
        Assertions.assertEquals(List.of(FUNC), messages.stream().map(VerificationMessage::verifier)
            .filter(v -> v != null).distinct().toList(), "Nothing but the Functional Verifier spoke");
        Assertions.assertTrue(client.startedJobs().isEmpty());
        Assertions.assertTrue(job.isHasResult());
        Assertions.assertTrue(job.getFormula().isProven());
        VerifierEntry funcEntry = job.getFormula().getStatement().getVerifiers().get(FUNC);
        Assertions.assertEquals(Boolean.TRUE, funcEntry.proven(), "func gets a result-only entry even functional-only");
        Assertions.assertNull(funcEntry.status(), "func never carries a status");
        Assertions.assertEquals(Boolean.TRUE, job.getFormula().getVerifiers().get(FUNC).proven(),
            "The Root's own verifiers map also gets a func entry");
        VerificationMessage funcDone = messages.stream()
            .filter(m -> FUNC.equals(m.verifier()) && VerificationMessage.DONE.equals(m.type())).findFirst().orElseThrow();
        Assertions.assertNotNull(funcDone.durationMs());
        Assertions.assertTrue(funcDone.durationMs() >= 0, funcDone.toString());
    }

    @Test
    void aFunctionalOnlyRunMarksEveryNonFunctionalCatalogVerifierDisabledOnStatementsAndRoot() throws Exception {
        start(true, true, new FakeVerifierClient());
        awaitComplete();

        for (String id : List.of("mock", "off")) {
            VerifierEntry statementEntry = job.getFormula().getStatement().getVerifiers().get(id);
            Assertions.assertEquals(Boolean.FALSE, statementEntry.proven(), id);
            Assertions.assertEquals(Boolean.TRUE, statementEntry.disabled(),
                id + " did not run: functional-only disables every non-functional Verifier, enabled or not");
            Assertions.assertNull(statementEntry.status(), id);

            VerifierEntry rootEntry = job.getFormula().getVerifiers().get(id);
            Assertions.assertEquals(Boolean.FALSE, rootEntry.proven(), id + " on the Root");
            Assertions.assertEquals(Boolean.TRUE, rootEntry.disabled(), id + " on the Root");
            Assertions.assertNull(rootEntry.status(), id + " on the Root");
        }
    }

    @Test
    void aFunctionalOnlyRunClearsWhatAnEarlierAllRunLeftOnEveryNonFunctionalEntry() throws Exception {
        StubStatement stub = new StubStatement(true);
        stub.setVerifiers(new HashMap<>(Map.of("mock", new VerifierEntry(null, null, null, true, "2.5 J", null, null))));
        CbCFormula formula = new CbCFormula("Demo", stub, List.of(), List.of(), List.of(),
            new HashMap<>(Map.of("mock", new VerifierEntry(null, null, null, true, "2.5 J", null, null))), false);
        job = new VerificationJob(JOB, Optional.empty(), true, formula, null,
            new VerifierFanOut(new FakeVerifierClient(), Runnable::run), CompletableFuture.completedFuture(CATALOG), () -> { });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });

        job.start();
        awaitComplete();

        VerifierEntry statementEntry = job.getFormula().getStatement().getVerifiers().get("mock");
        Assertions.assertEquals(Boolean.FALSE, statementEntry.proven(), "An earlier run's pass must not survive this one");
        Assertions.assertEquals(Boolean.TRUE, statementEntry.disabled());
        Assertions.assertNull(statementEntry.status(), "Nor its status text");
        VerifierEntry rootEntry = job.getFormula().getVerifiers().get("mock");
        Assertions.assertEquals(Boolean.FALSE, rootEntry.proven());
        Assertions.assertEquals(Boolean.TRUE, rootEntry.disabled());
        Assertions.assertNull(rootEntry.status());
    }

    @Test
    void functionalFailureEndsTheJobWithoutCallingAnyVerifier() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient().running("mock", Map.of(), new StatusMessage.Done(true, null));

        start(false, false, client);
        awaitComplete();

        List<VerificationMessage> tail = messages.subList(messages.size() - 2, messages.size());
        Assertions.assertEquals(List.of(doneIgnoringDuration(FUNC, false), completeIgnoringDuration()), withoutDuration(tail));
        Assertions.assertTrue(client.startedJobs().isEmpty(), "No Verifier runs against a program that failed functionally");
        Assertions.assertTrue(of("mock").isEmpty());
        Assertions.assertFalse(job.getFormula().isProven());
        VerifierEntry funcEntry = job.getFormula().getStatement().getVerifiers().get(FUNC);
        Assertions.assertEquals(Boolean.FALSE, funcEntry.proven(), "A functional failure writes proven:false, not a stale true");
        Assertions.assertEquals(Boolean.FALSE, job.getFormula().getVerifiers().get(FUNC).proven());

        VerifierEntry mockEntry = job.getFormula().getStatement().getVerifiers().get("mock");
        Assertions.assertEquals(Boolean.FALSE, mockEntry.proven());
        Assertions.assertEquals(Boolean.TRUE, mockEntry.disabled(), "mock was enabled, but the functional gate kept it from running");
        Assertions.assertNull(mockEntry.status());
        Assertions.assertNull(mockEntry.settingsUpdatedAt(), "A disabled entry carries no stamp");
        Assertions.assertEquals(Boolean.TRUE, job.getFormula().getVerifiers().get("mock").disabled(), "The Root too");
        Assertions.assertEquals(Boolean.TRUE, job.getFormula().getVerifiers().get("off").disabled(),
            "And the Verifier that was not enabled is marked as not run");
        VerificationMessage funcDone = messages.stream()
            .filter(m -> FUNC.equals(m.verifier()) && VerificationMessage.DONE.equals(m.type())).findFirst().orElseThrow();
        Assertions.assertNotNull(funcDone.durationMs(), "Even a failing functional run reports how long it took");
        Assertions.assertTrue(funcDone.durationMs() >= 0, funcDone.toString());
    }

    @Test
    void functionalSuccessFansOutToTheEnabledVerifiersAndCompletesOnceAfterAllOfThem() throws Exception {
        CountDownLatch release = new CountDownLatch(1);
        FakeVerifierClient client = new FakeVerifierClient()
            .running("mock", Map.of("1", new StatementResult(true, "ok")), new StatusMessage.Log("checking"), new StatusMessage.Done(true, null))
            .holdingDone("mock", release)
            .running("off", Map.of(), new StatusMessage.Done(true, null));

        start(false, true, client);
        long deadline = System.currentTimeMillis() + 5000;
        while (of("mock").isEmpty() && System.currentTimeMillis() < deadline) {
            Thread.sleep(10);
        }

        Assertions.assertEquals(List.of(VerificationMessage.log("mock", "checking")), of("mock"));
        Assertions.assertTrue(messages.contains(VerificationMessage.log(null, "calling mock")),
            "The orchestration line naming which Verifiers are called carries no verifier tag");
        Assertions.assertTrue(withoutDuration(messages).contains(doneIgnoringDuration(FUNC, true)), "Functional's own done came first");
        Assertions.assertFalse(job.isHasResult(), "No result while a Verifier is still running");
        Assertions.assertFalse(types().contains(VerificationMessage.COMPLETE));

        release.countDown();
        awaitComplete();

        Assertions.assertEquals(1, types().stream().filter(VerificationMessage.COMPLETE::equals).count(), "Complete exactly once");
        Assertions.assertEquals(completeIgnoringDuration(), withoutDuration(messages.get(messages.size() - 1)));
        Assertions.assertEquals(doneIgnoringDuration("mock", true), withoutDuration(messages.get(messages.size() - 2)));
        Assertions.assertEquals(List.of("mock"), client.startedJobs().stream().map(FakeVerifierClient.StartedJob::id).toList(),
            "Only the enabled Verifier is called; func is built in and 'off' is disabled");
        Assertions.assertEquals(List.of(), client.startedJobs().get(0).request().files(), "No project: no files, still attached");
        Assertions.assertTrue(job.isHasResult());
        Assertions.assertEquals(Boolean.TRUE, job.getFormula().getStatement().getVerifiers().get("mock").proven());
        Assertions.assertEquals("ok", job.getFormula().getStatement().getVerifiers().get("mock").status());
        VerifierEntry mockRoot = job.getFormula().getVerifiers().get("mock");
        Assertions.assertEquals(Boolean.TRUE, mockRoot.proven(), "The Root carries what the Verifier's own done said");
        Assertions.assertNull(mockRoot.status(), "This Verifier sent no whole-run status");
        Assertions.assertNull(mockRoot.disabled());
        Assertions.assertTrue(job.getFormula().isProven(),
            "Aggregate: func.proven && mock.proven, 'off' is disabled and ignored");
        Assertions.assertEquals(Boolean.TRUE, job.getFormula().getStatement().getVerifiers().get(FUNC).proven());
    }

    @Test
    void orchestrationLinesCarryNoVerifierTagWhileFunctionalStatusLinesKeepFunc() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient();

        start(false, true, client, CATALOG_NO_OTHER_VERIFIERS);
        awaitComplete();

        Assertions.assertTrue(messages.contains(VerificationMessage.log(null, "no other Verifier is enabled")),
            "An orchestration line (no other Verifier enabled) carries no verifier tag");
        Assertions.assertTrue(messages.contains(VerificationMessage.log(null, "verification initialized")),
            "The job's own lifecycle line carries no verifier tag");
        Assertions.assertTrue(messages.contains(VerificationMessage.log(FUNC, "functional verification complete")),
            "A functional-status line still carries the func tag");

        VerifierEntry offEntry = job.getFormula().getStatement().getVerifiers().get("off");
        Assertions.assertEquals(Boolean.FALSE, offEntry.proven(),
            "Every catalog Verifier's entry is reset even when fan-out itself is skipped");
        Assertions.assertEquals(Boolean.TRUE, offEntry.disabled());
        Assertions.assertNull(offEntry.status());
        Assertions.assertTrue(job.getFormula().isProven(),
            "No other Verifier is enabled: the aggregate reduces to func.proven");
    }

    @Test
    void aDisabledVerifierIsMarkedDisabledOnStatementsAndRootOnTheSameRunThatFansOutToAnEnabledOne() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .running("mock", Map.of("1", new StatementResult(true, "ok")), new StatusMessage.Done(true, null));

        start(false, true, client);
        awaitComplete();

        VerifierEntry offEntry = job.getFormula().getStatement().getVerifiers().get("off");
        Assertions.assertEquals(Boolean.FALSE, offEntry.proven());
        Assertions.assertEquals(Boolean.TRUE, offEntry.disabled());
        Assertions.assertNull(offEntry.status());
        VerifierEntry offRoot = job.getFormula().getVerifiers().get("off");
        Assertions.assertEquals(Boolean.FALSE, offRoot.proven(), "The Root is marked like every statement");
        Assertions.assertEquals(Boolean.TRUE, offRoot.disabled());
        Assertions.assertNull(offRoot.status());
        Assertions.assertEquals(Boolean.TRUE, job.getFormula().getStatement().getVerifiers().get("mock").proven(),
            "The enabled Verifier's own result is unaffected by the disabled one's reset entry");
    }

    @Test
    void funcEntrySurvivesResetAndAFailingVerifiersMarkFailedUnchanged() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .failingToStart("mock", new VerifierUnreachableException("Connection refused", null));

        start(false, true, client);
        awaitComplete();

        VerifierEntry funcEntry = job.getFormula().getStatement().getVerifiers().get(FUNC);
        Assertions.assertEquals(Boolean.TRUE, funcEntry.proven(),
            "func is written before fan-out and untouched by resetForRun/markFailed");
        Assertions.assertNull(funcEntry.status(), "func never gets a status, even after a fan-out with a failing Verifier");

        VerifierEntry mockEntry = job.getFormula().getStatement().getVerifiers().get("mock");
        Assertions.assertEquals(Boolean.FALSE, mockEntry.proven());
        Assertions.assertTrue(mockEntry.status().contains("could not be started"));
        VerifierEntry mockRoot = job.getFormula().getVerifiers().get("mock");
        Assertions.assertEquals(Boolean.FALSE, mockRoot.proven(), "A Verifier that could not be started failed for the Root too");
        Assertions.assertTrue(mockRoot.status().contains("could not be started"), mockRoot.status());
        Assertions.assertNull(mockRoot.disabled(), "Failed outright is a failure, not a Verifier that did not run");
        Assertions.assertFalse(job.getFormula().isProven(), "func.proven && mock.proven(false) => false");
    }

    @Test
    void aStaleFuncEntryFromAnEarlierRunIsOverwrittenNotLeftStaleOnFunctionalFailure() throws Exception {
        StubStatement stub = new StubStatement(false);
        stub.setVerifiers(new HashMap<>(Map.of(FUNC, new VerifierEntry(null, null, null, true, null, null, null))));
        CbCFormula formula = new CbCFormula("Demo", stub, List.of(), List.of(), List.of(),
            new HashMap<>(Map.of(FUNC, new VerifierEntry(null, null, null, true, null, null, null))), false);
        job = new VerificationJob(JOB, Optional.empty(), false, formula, null,
            new VerifierFanOut(new FakeVerifierClient(), Runnable::run), CompletableFuture.completedFuture(CATALOG), () -> { });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });

        job.start();
        awaitComplete();

        Assertions.assertEquals(Boolean.FALSE, job.getFormula().getStatement().getVerifiers().get(FUNC).proven(),
            "A stale true from an earlier run must not survive a fresh functional failure");
        Assertions.assertEquals(Boolean.FALSE, job.getFormula().getVerifiers().get(FUNC).proven());
    }

    @Test
    void aFanOutCrashOutsideAnyVerifiersOwnRunLeavesACorrectlyRecomputedIsProvenNotAStalePreFanOutValue() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient();
        VerifierFanOut brokenFanOut = new VerifierFanOut(client, Runnable::run) {
            @Override
            public void run(UUID jobId, NarrowedProgram program, List<SourceFile> files, List<ResolvedVerifier> verifiers,
                            Consumer<VerificationMessage> sink) {
                throw new RuntimeException("boom");
            }
        };
        CbCFormula formula = new CbCFormula("Demo", new StubStatement(true), List.of(), List.of(), List.of(), null, false);
        job = new VerificationJob(JOB, Optional.empty(), false, formula, null, brokenFanOut,
            CompletableFuture.completedFuture(CATALOG), () -> { });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });

        job.start();
        awaitComplete();

        Assertions.assertTrue(messages.contains(VerificationMessage.log(null, "calling the Verifiers failed unexpectedly: boom")));
        Assertions.assertEquals(Boolean.FALSE, job.getFormula().getStatement().getVerifiers().get("mock").proven(),
            "Reset default: the crash happened before mock ever reported anything");
        Assertions.assertFalse(job.getFormula().isProven(),
            "The aggregate is recomputed from the enabled Verifier's (reset) entry, not left at the stale pre-fan-out functional value");
    }

    @Test
    void theStampsTheRequestCarriedAreRewrittenFromThisJobsOverridesOnEveryEntry() throws Exception {
        // No project: no Overrides, so this job's stamp is "none" for every Verifier.
        StubStatement stub = new StubStatement(true);
        stub.setVerifiers(new HashMap<>(Map.of(
            "mock", new VerifierEntry(null, null, null, true, null, null, 5L),
            "off", new VerifierEntry(null, null, null, true, null, null, 5L))));
        CbCFormula formula = new CbCFormula("Demo", stub, List.of(), List.of(), List.of(),
            new HashMap<>(Map.of("mock", new VerifierEntry(null, null, null, true, null, null, 5L))), false);
        FakeVerifierClient client = new FakeVerifierClient()
            .running("mock", Map.of("1", new StatementResult(true, null)), new StatusMessage.Done(true, null));
        job = new VerificationJob(JOB, Optional.empty(), false, formula, null,
            new VerifierFanOut(client, Runnable::run), CompletableFuture.completedFuture(CATALOG), () -> { });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });

        job.start();
        awaitComplete();

        Assertions.assertNull(job.getFormula().getStatement().getVerifiers().get("mock").settingsUpdatedAt(),
            "The enabled Verifier's entry carries this job's stamp, not the one the request sent");
        Assertions.assertNull(job.getFormula().getVerifiers().get("mock").settingsUpdatedAt(), "The Root too");
        Assertions.assertNull(job.getFormula().getStatement().getVerifiers().get("off").settingsUpdatedAt(),
            "A disabled entry carries none");
    }

    @Test
    void funcsDurationMeasuresAtLeastTheTimeItsProveActuallyTook() throws Exception {
        long sleepMs = 50;
        CbCFormula formula = new CbCFormula("Demo", new StubStatement(true, sleepMs), List.of(), List.of(), List.of(), null, false);
        job = new VerificationJob(JOB, Optional.empty(), true, formula, null,
            new VerifierFanOut(new FakeVerifierClient(), Runnable::run), CompletableFuture.completedFuture(CATALOG), () -> { });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });

        job.start();
        awaitComplete();

        VerificationMessage funcDone = messages.stream()
            .filter(m -> FUNC.equals(m.verifier()) && VerificationMessage.DONE.equals(m.type())).findFirst().orElseThrow();
        Assertions.assertTrue(funcDone.durationMs() >= sleepMs,
            "Expected at least " + sleepMs + "ms since prove() slept that long, was " + funcDone.durationMs());
    }

    @Test
    void completesDurationIsAtLeastFuncsDoneDuration() throws Exception {
        long sleepMs = 50;
        CbCFormula formula = new CbCFormula("Demo", new StubStatement(true, sleepMs), List.of(), List.of(), List.of(), null, false);
        job = new VerificationJob(JOB, Optional.empty(), true, formula, null,
            new VerifierFanOut(new FakeVerifierClient(), Runnable::run), CompletableFuture.completedFuture(CATALOG), () -> { });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });

        job.start();
        awaitComplete();

        VerificationMessage funcDone = messages.stream()
            .filter(m -> FUNC.equals(m.verifier()) && VerificationMessage.DONE.equals(m.type())).findFirst().orElseThrow();
        VerificationMessage complete = messages.stream()
            .filter(m -> VerificationMessage.COMPLETE.equals(m.type())).findFirst().orElseThrow();
        Assertions.assertNotNull(complete.durationMs());
        Assertions.assertTrue(complete.durationMs() >= funcDone.durationMs(),
            "complete is emitted after func's done, on the same clock, so it can only be later: func="
                + funcDone.durationMs() + " complete=" + complete.durationMs());
    }

    @Test
    void aFailedResetIsLoggedUntaggedAndTheJobStillCompletes() throws Exception {
        CompletableFuture<VerifierCatalog> brokenCatalog = new CompletableFuture<>();
        brokenCatalog.completeExceptionally(new RuntimeException("catalog service down"));
        CbCFormula formula = new CbCFormula("Demo", new StubStatement(true), List.of(), List.of(), List.of(), null, false);
        job = new VerificationJob(JOB, Optional.empty(), true, formula, null,
            new VerifierFanOut(new FakeVerifierClient(), Runnable::run), brokenCatalog, () -> { });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });

        job.start();
        awaitComplete();

        Assertions.assertTrue(
            messages.stream().anyMatch(m -> m.verifier() == null && m.message() != null
                && m.message().contains("catalog service down")),
            "The failure is reported as an orchestration line carrying its cause: " + messages);
    }

    @Test
    void aLateSubscriberGetsTheWholeHistoryOnceInOrder() throws Exception {
        start(true, true, new FakeVerifierClient());
        awaitComplete();
        List<VerificationMessage> replayed = new ArrayList<>();

        job.subscribe(message -> {
            replayed.add(message);
            return false;
        });

        Assertions.assertEquals(messages, replayed);
    }

    @Test
    void aListenerReportingItsConnectionClosedIsDropped() throws Exception {
        List<VerificationMessage> seen = new ArrayList<>();
        FakeVerifierClient client = new FakeVerifierClient();
        CbCFormula formula = new CbCFormula("Demo", new StubStatement(true), List.of(), List.of(), List.of(), null, false);
        job = new VerificationJob(JOB, Optional.empty(), true, formula, null,
            new VerifierFanOut(client, Runnable::run), CompletableFuture.completedFuture(CATALOG), () -> { });
        job.subscribe(message -> {
            seen.add(message);
            return true;
        });
        job.subscribe(message -> {
            messages.add(message);
            if (VerificationMessage.COMPLETE.equals(message.type())) {
                completed.countDown();
            }
            return false;
        });

        job.start();
        awaitComplete();

        Assertions.assertEquals(List.of(VerificationMessage.log(null, "verification initialized")), seen,
            "Dropped on its first message, which was the replayed history");
    }
}
