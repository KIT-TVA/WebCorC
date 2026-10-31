package edu.kit.cbc.editor;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.VerifierEntry;
import edu.kit.cbc.common.corc.cbcmodel.statements.CompositionStatement;
import edu.kit.cbc.editor.verifier.FakeVerifierClient;
import edu.kit.cbc.editor.verifier.InvalidVerifierResponseException;
import edu.kit.cbc.editor.verifier.ResolvedVerifier;
import edu.kit.cbc.editor.verifier.VerifierUnreachableException;
import edu.kit.cbc.editor.verifier.job.NarrowedProgram;
import edu.kit.cbc.editor.verifier.job.SourceFile;
import edu.kit.cbc.editor.verifier.job.StartJobRequest;
import edu.kit.cbc.editor.verifier.job.StatementResult;
import edu.kit.cbc.editor.verifier.job.StatusMessage;
import io.micronaut.json.tree.JsonNode;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;
import java.util.function.Consumer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * The fan-out to the enabled Verifiers, driven through the {@link FakeVerifierClient}: every
 * Verifier is called at once with its own narrowed program, files and resolved Settings; its
 * messages are relayed tagged with its id; a failure at any step is that Verifier's failure
 * alone (a log line, then its {@code done(proven: false)}); and the run returns only once every
 * Verifier has reported done, each result already merged into the formula tree.
 */
class VerifierFanOutTest {

    private static final String FORMULA_JSON = """
        {
          "name": "Demo", "javaVariables": [], "globalConditions": [], "renamings": [], "isProven": true,
          "verifiers": {"eebc": {"preCondition": {"condition": "e == 0"}, "postCondition": {"condition": "e <= 1"}}},
          "statement": {
            "name": "Comp", "type": "COMPOSITION", "isProven": true,
            "preCondition": {"condition": "x == 0"}, "postCondition": {"condition": "x == 2"},
            "intermediateCondition": {"condition": "x == 1"},
            "verifiers": {"eebc": {"preCondition": {"condition": "e == 0"}, "postCondition": {"condition": "e <= 1"}}},
            "firstStatement": {
              "name": "First", "type": "STATEMENT", "isProven": true, "programStatement": "x = 1;",
              "preCondition": {"condition": "x == 0"}, "postCondition": {"condition": "x == 1"}
            },
            "secondStatement": {
              "name": "Second", "type": "STATEMENT", "isProven": true, "programStatement": "x = 2;",
              "preCondition": {"condition": "x == 1"}, "postCondition": {"condition": "x == 2"},
              "verifiers": {"sec": {"preCondition": {"condition": "safe(x)"}, "postCondition": {"condition": "safe(x)"}}}
            }
          }
        }
        """;

    private static final UUID JOB = UUID.randomUUID();
    private static final List<SourceFile> FILES = List.of(new SourceFile("javaSrc/Demo.java", "class Demo {}"));
    private static final ResolvedVerifier EEBC = new ResolvedVerifier("eebc", Map.of("threshold", JsonNode.createStringNode("50")), null,
        List.of("e"), false);
    private static final ResolvedVerifier SEC = new ResolvedVerifier("sec", Map.of(), null, List.of("x"), false);
    private static final VerifierUnreachableException UNREACHABLE = new VerifierUnreachableException("Connection refused", null);
    private static final InvalidVerifierResponseException INVALID = new InvalidVerifierResponseException("answered 400", null);
    private static final Map<String, StatementResult> ALL_PROVEN = Map.of(
        "1", new StatementResult(true, "3 J"), "2", new StatementResult(true, null), "3", new StatementResult(true, null));

    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final List<VerificationMessage> messages = new CopyOnWriteArrayList<>();

    @AfterEach
    void shutDown() {
        executor.shutdownNow();
    }

    private static CbCFormula formula() throws Exception {
        return new ObjectMapper().readValue(FORMULA_JSON, CbCFormula.class);
    }

    private static StatusMessage log(String message) {
        return new StatusMessage.Log(message);
    }

    private static StatusMessage done(boolean proven) {
        return new StatusMessage.Done(proven, null);
    }

    private static StatusMessage done(boolean proven, String status) {
        return new StatusMessage.Done(proven, status);
    }

    /**
     * An expected {@code done} for equality checks against {@link #of}, which strips the real,
     * timing-dependent {@code durationMs} before comparing.
     */
    private static VerificationMessage doneIgnoringDuration(String verifier, boolean proven) {
        return new VerificationMessage(VerificationMessage.DONE, verifier, null, proven, null);
    }

    private List<VerificationMessage> of(String verifier) {
        return messages.stream()
            .filter(message -> verifier.equals(message.verifier()))
            .map(VerifierFanOutTest::withoutDuration)
            .toList();
    }

    /** {@code durationMs} is real elapsed time, so equality checks against a fixed expectation strip it. */
    private static VerificationMessage withoutDuration(VerificationMessage message) {
        return VerificationMessage.DONE.equals(message.type())
            ? new VerificationMessage(message.type(), message.verifier(), message.message(), message.proven(), null)
            : message;
    }

    /** Every {@code done} sent so far carries a real, non-negative duration. */
    private void assertDoneDurationsAreNonNegative() {
        for (VerificationMessage message : messages) {
            if (VerificationMessage.DONE.equals(message.type())) {
                Assertions.assertNotNull(message.durationMs(), message.toString());
                Assertions.assertTrue(message.durationMs() >= 0, message.toString());
            }
        }
    }

    private void run(FakeVerifierClient client, NarrowedProgram program, ResolvedVerifier... verifiers) {
        new VerifierFanOut(client, executor).run(JOB, program, FILES, List.of(verifiers), messages::add);
    }

    @Test
    void relaysEveryVerifiersMessagesTaggedAndMergesItsResult() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .running("eebc", ALL_PROVEN, log("measuring"), log("within budget"), done(true))
            .running("sec", Map.of("3", new StatementResult(false, "leak")), log("scanning"), done(false));
        CbCFormula formula = formula();

        run(client, NarrowedProgram.of(formula), EEBC, SEC);

        Assertions.assertEquals(List.of(
            VerificationMessage.log("eebc", "measuring"),
            VerificationMessage.log("eebc", "within budget"),
            doneIgnoringDuration("eebc", true)), of("eebc"));
        Assertions.assertEquals(List.of(
            VerificationMessage.log("sec", "scanning"),
            doneIgnoringDuration("sec", false)), of("sec"));
        Assertions.assertEquals(5, messages.size(), "Nothing else is sent: " + messages);

        CompositionStatement root = (CompositionStatement) formula.getStatement();
        Assertions.assertEquals(Boolean.TRUE, root.getVerifiers().get("eebc").proven());
        Assertions.assertEquals("3 J", root.getVerifiers().get("eebc").status());
        Assertions.assertEquals(Boolean.TRUE, root.getFirstStatement().getVerifiers().get("eebc").proven());
        Assertions.assertEquals(Boolean.FALSE, root.getSecondStatement().getVerifiers().get("sec").proven());
        Assertions.assertEquals("leak", root.getSecondStatement().getVerifiers().get("sec").status());
        Assertions.assertEquals("safe(x)", root.getSecondStatement().getVerifiers().get("sec").preCondition().getCondition(),
            "The authored Verifier Condition survives the merge");
        Assertions.assertTrue(formula.isProven(), "The Functional Verifier's verdict is untouched");
        assertDoneDurationsAreNonNegative();
    }

    @Test
    void theRootCarriesWhatEachVerifiersDoneSaidAboutTheWholeRun() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .running("eebc", ALL_PROVEN, done(true, "3 J over the whole program"))
            .running("sec", Map.of("3", new StatementResult(false, "leak")), done(false));
        CbCFormula formula = formula();

        run(client, NarrowedProgram.of(formula), EEBC, SEC);

        VerifierEntry eebcRoot = formula.getVerifiers().get("eebc");
        Assertions.assertEquals(Boolean.TRUE, eebcRoot.proven(), "The Root's verdict is the Verifier's own, not the top statement's");
        Assertions.assertEquals("3 J over the whole program", eebcRoot.status());
        Assertions.assertNull(eebcRoot.disabled());
        Assertions.assertEquals("e == 0", eebcRoot.preCondition().getCondition(), "The Root's authored condition survives");

        VerifierEntry secRoot = formula.getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, secRoot.proven());
        Assertions.assertNull(secRoot.status(), "sec said nothing about the run as a whole");
    }

    @Test
    void aVerifiersPerStatementResultNeverWritesTheRoot() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient().running("eebc", ALL_PROVEN, done(false, "over budget"));
        CbCFormula formula = formula();

        run(client, NarrowedProgram.of(formula), EEBC);

        Assertions.assertEquals(Boolean.TRUE, formula.getStatement().getVerifiers().get("eebc").proven(),
            "Every statement it reported on passed");
        VerifierEntry eebcRoot = formula.getVerifiers().get("eebc");
        Assertions.assertEquals(Boolean.FALSE, eebcRoot.proven(),
            "The Root says what done said, even where it contradicts every statement's own result");
        Assertions.assertEquals("over budget", eebcRoot.status());
    }

    @Test
    void eachVerifierIsStartedUnderTheJobIdWithItsOwnProgramTheFilesAndItsSettings() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .running("eebc", ALL_PROVEN, done(true))
            .running("sec", Map.of(), done(true));

        run(client, NarrowedProgram.of(formula()), EEBC, SEC);

        Assertions.assertEquals(2, client.startedJobs().size());
        for (FakeVerifierClient.StartedJob started : client.startedJobs()) {
            Assertions.assertEquals(JOB, started.jobId(), "The editor job's id is the Verifier job's id");
            Assertions.assertEquals(FILES, started.request().files(), "Files are attached unconditionally");
        }
        StartJobRequest eebc = client.startedJobs().stream().filter(s -> s.id().equals("eebc")).findFirst().orElseThrow().request();
        StartJobRequest sec = client.startedJobs().stream().filter(s -> s.id().equals("sec")).findFirst().orElseThrow().request();
        Assertions.assertEquals("e == 0", eebc.program().preCondition().condition(), "eebc's own root condition");
        Assertions.assertNull(sec.program().preCondition(), "sec wrote none for the root");
        Assertions.assertEquals("safe(x)", sec.program().statement().secondStatement().preCondition().condition());
        Assertions.assertNull(eebc.program().statement().secondStatement().preCondition());
        Assertions.assertEquals(Map.of("threshold", JsonNode.createStringNode("50")), eebc.settings());
        Assertions.assertEquals(Map.of(), sec.settings());
    }

    @Test
    void runsTheVerifiersAtTheSameTimeAndReturnsOnlyOnceEveryOneReportedDone() throws Exception {
        CountDownLatch releaseEebc = new CountDownLatch(1);
        CountDownLatch releaseSec = new CountDownLatch(1);
        FakeVerifierClient client = new FakeVerifierClient()
            .running("eebc", ALL_PROVEN, log("eebc working"), done(true)).holdingDone("eebc", releaseEebc)
            .running("sec", Map.of(), log("sec working"), done(true)).holdingDone("sec", releaseSec);
        NarrowedProgram program = NarrowedProgram.of(formula());

        CompletableFuture<Void> run = CompletableFuture.runAsync(() -> run(client, program, EEBC, SEC), executor);

        awaitUntil(() -> of("eebc").size() == 1 && of("sec").size() == 1);
        Assertions.assertEquals(2, client.startedJobs().size(), "Both were started before either finished");
        Assertions.assertFalse(run.isDone());

        releaseSec.countDown();
        awaitUntil(() -> of("sec").size() == 2);
        Assertions.assertEquals(doneIgnoringDuration("sec", true), of("sec").get(1), "sec's done needs no wait for eebc");
        Assertions.assertFalse(run.isDone(), "Not everything is done while eebc is still running");
        Assertions.assertEquals(1, of("eebc").size());

        releaseEebc.countDown();
        run.get(5, TimeUnit.SECONDS);
        Assertions.assertEquals(doneIgnoringDuration("eebc", true), of("eebc").get(1));
    }

    @Test
    void aVerifierThatCannotBeStartedFailsAloneAndTheOthersProceed() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .failingToStart("sec", UNREACHABLE)
            .running("eebc", ALL_PROVEN, log("measuring"), done(true));
        CbCFormula formula = formula();

        run(client, NarrowedProgram.of(formula), SEC, EEBC);

        Assertions.assertEquals(2, of("sec").size(), of("sec").toString());
        Assertions.assertEquals(VerificationMessage.LOG, of("sec").get(0).type());
        Assertions.assertTrue(of("sec").get(0).message().contains("Connection refused"), of("sec").get(0).message());
        Assertions.assertEquals(doneIgnoringDuration("sec", false), of("sec").get(1));
        Assertions.assertEquals(List.of("eebc"), client.startedJobs().stream().map(FakeVerifierClient.StartedJob::id).toList());
        Assertions.assertEquals(doneIgnoringDuration("eebc", true), of("eebc").get(1));
        Assertions.assertEquals(Boolean.TRUE, formula.getStatement().getVerifiers().get("eebc").proven(),
            "An unrelated Verifier's own result is untouched by sec's failure");

        CompositionStatement root = (CompositionStatement) formula.getStatement();
        VerifierEntry secRoot = root.getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, secRoot.proven());
        Assertions.assertTrue(secRoot.status().contains("Connection refused"), secRoot.status());
        VerifierEntry secFirst = root.getFirstStatement().getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, secFirst.proven(),
            "Every statement gets the failing Verifier's entry, not just ones with an authored condition");
        VerifierEntry secSecond = root.getSecondStatement().getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, secSecond.proven());
        Assertions.assertEquals("safe(x)", secSecond.preCondition().getCondition(), "The authored condition survives the failure marking");
        assertDoneDurationsAreNonNegative();
    }

    @Test
    void aVerifierWhoseStatusStreamFailsIsDoneFalseWithoutAResult() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient().failingToStream("eebc", INVALID);
        CbCFormula formula = formula();

        run(client, NarrowedProgram.of(formula), EEBC);

        Assertions.assertEquals(VerificationMessage.LOG, of("eebc").get(0).type());
        Assertions.assertTrue(of("eebc").get(0).message().contains("answered 400"), of("eebc").get(0).message());
        Assertions.assertEquals(doneIgnoringDuration("eebc", false), of("eebc").get(1));
        VerifierEntry eebcRoot = formula.getStatement().getVerifiers().get("eebc");
        Assertions.assertEquals(Boolean.FALSE, eebcRoot.proven(), "No result was fetched, but the failure is still marked");
        Assertions.assertTrue(eebcRoot.status().contains("answered 400"), eebcRoot.status());
        Assertions.assertEquals("e == 0", eebcRoot.preCondition().getCondition(), "The authored condition survives the failure marking");
        assertDoneDurationsAreNonNegative();
    }

    @Test
    void aVerifierWhoseResultCannotBeFetchedIsDoneFalseAfterItsLogs() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient()
            .failingResult("eebc", UNREACHABLE, log("measuring"), done(true));
        CbCFormula formula = formula();

        run(client, NarrowedProgram.of(formula), EEBC);

        Assertions.assertEquals(3, of("eebc").size(), of("eebc").toString());
        Assertions.assertEquals(VerificationMessage.log("eebc", "measuring"), of("eebc").get(0));
        Assertions.assertTrue(of("eebc").get(1).message().contains("Connection refused"), of("eebc").get(1).message());
        Assertions.assertEquals(doneIgnoringDuration("eebc", false), of("eebc").get(2),
            "The Verifier said proven, but its result is lost: the run failed");
        VerifierEntry eebcRoot = formula.getStatement().getVerifiers().get("eebc");
        Assertions.assertEquals(Boolean.FALSE, eebcRoot.proven());
        Assertions.assertTrue(eebcRoot.status().contains("Connection refused"), eebcRoot.status());
        assertDoneDurationsAreNonNegative();
    }

    @Test
    void doneIsSentOnlyOnceTheResultIsMerged() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient().running("eebc", ALL_PROVEN, done(true));
        CbCFormula formula = formula();
        List<Boolean> mergedAtDone = new CopyOnWriteArrayList<>();
        Consumer<VerificationMessage> sink = message -> {
            if (VerificationMessage.DONE.equals(message.type())) {
                mergedAtDone.add(formula.getStatement().getVerifiers().get("eebc").proven() != null);
            }
        };

        new VerifierFanOut(client, executor).run(JOB, NarrowedProgram.of(formula), FILES, List.of(EEBC), sink);

        Assertions.assertEquals(List.of(true), mergedAtDone);
    }

    @Test
    void anUnexpectedFailureInOneVerifiersRunDoesNotHangTheOthers() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient() {
            @Override
            public void startJob(String id, UUID jobId, StartJobRequest request)
                throws VerifierUnreachableException, InvalidVerifierResponseException {
                if (id.equals("sec")) {
                    throw new IllegalArgumentException("Verifier 'sec' is not registered");
                }
                super.startJob(id, jobId, request);
            }
        }.running("eebc", ALL_PROVEN, done(true));
        CbCFormula formula = formula();

        Assertions.assertTimeoutPreemptively(Duration.ofSeconds(5),
            () -> run(client, NarrowedProgram.of(formula), SEC, EEBC));

        Assertions.assertEquals(doneIgnoringDuration("sec", false), of("sec").get(of("sec").size() - 1));
        Assertions.assertTrue(of("sec").get(0).message().contains("not registered"), of("sec").get(0).message());
        Assertions.assertEquals(doneIgnoringDuration("eebc", true), of("eebc").get(0));

        VerifierEntry secSecond = ((CompositionStatement) formula.getStatement()).getSecondStatement().getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, secSecond.proven());
        Assertions.assertTrue(secSecond.status().contains("not registered"), secSecond.status());
        Assertions.assertEquals(Boolean.TRUE, formula.getStatement().getVerifiers().get("eebc").proven(),
            "An unrelated Verifier's own result is untouched by sec's unexpected failure");
        assertDoneDurationsAreNonNegative();
    }

    @Test
    void aVerifierWhoseConditionIsOutOfScopeFailsWithoutBeingCalledWhileAnotherRunsNormally() throws Exception {
        ResolvedVerifier secOutOfScope = new ResolvedVerifier("sec", Map.of(), null, List.of(), false);
        FakeVerifierClient client = new FakeVerifierClient().running("eebc", ALL_PROVEN, log("measuring"), done(true));
        CbCFormula formula = formula();

        run(client, NarrowedProgram.of(formula), secOutOfScope, EEBC);

        Assertions.assertEquals(2, of("sec").size(), of("sec").toString());
        Assertions.assertEquals(VerificationMessage.LOG, of("sec").get(0).type());
        Assertions.assertTrue(of("sec").get(0).message().contains("'x'"), of("sec").get(0).message());
        Assertions.assertEquals(doneIgnoringDuration("sec", false), of("sec").get(1));
        Assertions.assertEquals(List.of("eebc"), client.startedJobs().stream().map(FakeVerifierClient.StartedJob::id).toList(),
            "sec is never called");
        Assertions.assertEquals(doneIgnoringDuration("eebc", true), of("eebc").get(1));
        Assertions.assertEquals(Boolean.TRUE, formula.getStatement().getVerifiers().get("eebc").proven(),
            "An unrelated Verifier's own result is untouched by sec's scope violation");

        CompositionStatement root = (CompositionStatement) formula.getStatement();
        VerifierEntry secRoot = root.getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, secRoot.proven());
        Assertions.assertTrue(secRoot.status().contains("'x'"), secRoot.status());
        VerifierEntry secSecond = root.getSecondStatement().getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, secSecond.proven(),
            "Every statement gets the failing Verifier's entry, not just the one with the offending condition");
        Assertions.assertEquals("safe(x)", secSecond.preCondition().getCondition(), "The authored condition survives the failure marking");
        assertDoneDurationsAreNonNegative();
    }

    @Test
    void aVerifierWithASettingsViolationFailsWithoutBeingCalledWhileAnotherRunsNormally() throws Exception {
        String reason = "was not started: setting 'threshold' has the invalid value '150' (above its maximum 100)";
        ResolvedVerifier secInvalidSettings = new ResolvedVerifier("sec", Map.of(), Optional.of(reason), null, List.of(), false);
        FakeVerifierClient client = new FakeVerifierClient().running("eebc", ALL_PROVEN, log("measuring"), done(true));
        CbCFormula formula = formula();

        run(client, NarrowedProgram.of(formula), secInvalidSettings, EEBC);

        Assertions.assertEquals(2, of("sec").size(), of("sec").toString());
        Assertions.assertEquals(VerificationMessage.LOG, of("sec").get(0).type());
        Assertions.assertTrue(of("sec").get(0).message().contains(reason), of("sec").get(0).message());
        Assertions.assertEquals(doneIgnoringDuration("sec", false), of("sec").get(1));
        Assertions.assertEquals(List.of("eebc"), client.startedJobs().stream().map(FakeVerifierClient.StartedJob::id).toList(),
            "sec is never called");
        Assertions.assertEquals(doneIgnoringDuration("eebc", true), of("eebc").get(1));

        CompositionStatement root = (CompositionStatement) formula.getStatement();
        VerifierEntry secRoot = root.getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, secRoot.proven());
        Assertions.assertEquals(reason, secRoot.status());
        assertDoneDurationsAreNonNegative();
    }

    @Test
    void noEnabledVerifierMeansNothingIsCalled() throws Exception {
        FakeVerifierClient client = new FakeVerifierClient();

        run(client, NarrowedProgram.of(formula()));

        Assertions.assertTrue(messages.isEmpty());
        Assertions.assertTrue(client.startedJobs().isEmpty());
    }

    @Test
    void aVerifiersDurationMeasuresAtLeastTheTimeItsRunActuallyTook() throws Exception {
        CountDownLatch release = new CountDownLatch(1);
        long sleepMs = 50;
        FakeVerifierClient client = new FakeVerifierClient()
            .running("eebc", ALL_PROVEN, done(true)).holdingDone("eebc", release);
        NarrowedProgram program = NarrowedProgram.of(formula());

        CompletableFuture<Void> run = CompletableFuture.runAsync(() -> run(client, program, EEBC), executor);
        Thread.sleep(sleepMs);
        release.countDown();
        run.get(5, TimeUnit.SECONDS);

        VerificationMessage done = messages.stream()
            .filter(m -> "eebc".equals(m.verifier()) && VerificationMessage.DONE.equals(m.type()))
            .findFirst().orElseThrow();
        Assertions.assertNotNull(done.durationMs());
        Assertions.assertTrue(done.durationMs() >= sleepMs,
            "Expected at least " + sleepMs + "ms since the run was held open that long, was " + done.durationMs());
    }

    private static void awaitUntil(BooleanSupplier condition) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 5000;
        while (!condition.getAsBoolean()) {
            if (System.currentTimeMillis() > deadline) {
                throw new AssertionError("Timed out waiting");
            }
            Thread.sleep(10);
        }
    }
}
