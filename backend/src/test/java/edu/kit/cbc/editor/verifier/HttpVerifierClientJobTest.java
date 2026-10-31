package edu.kit.cbc.editor.verifier;

import edu.kit.cbc.editor.verifier.job.JobCondition;
import edu.kit.cbc.editor.verifier.job.JobProgram;
import edu.kit.cbc.editor.verifier.job.JobStatement;
import edu.kit.cbc.editor.verifier.job.SourceFile;
import edu.kit.cbc.editor.verifier.job.StartJobRequest;
import edu.kit.cbc.editor.verifier.job.StatementResult;
import edu.kit.cbc.editor.verifier.job.StatusMessage;
import io.micronaut.http.client.DefaultHttpClientConfiguration;
import io.micronaut.http.client.HttpClient;
import io.micronaut.json.JsonMapper;
import io.micronaut.json.tree.JsonNode;
import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * HttpVerifierClient tests for the three job operations of the Verifier API — start a job, stream
 * its status, fetch its result — against the in-JVM {@link StandInVerifier}. Failure
 * classification follows the same rule as {@code describe}: connect failure, timeout or 5xx is
 * unreachable; any other non-2xx status or a body/message that does not fit the contract is an
 * invalid response.
 */
class HttpVerifierClientJobTest {

    private static final UUID JOB = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String JOB_PATH = "/mock/jobs/" + JOB;
    private static final String RESULT_PATH = JOB_PATH + "/result";

    private static final String PROBLEM = "application/problem+json";

    private static final String EXPECTED_START_BODY = """
        {
          "program": {
            "name": "demo",
            "javaVariables": ["int x"],
            "preCondition": {"condition": "energy <= energyBudget"},
            "statement": {
              "id": 0, "name": "root", "type": "COMPOSITION",
              "intermediateCondition": {"condition": "mid"},
              "firstStatement": {"id": 1, "name": "s1", "type": "STATEMENT", "programStatement": "x = 1;"},
              "secondStatement": {
                "id": 2, "name": "loop", "type": "REPETITION",
                "guard": {"condition": "x > 0"},
                "invariant": {"condition": "x >= 0"},
                "variant": {"condition": "x"},
                "loopStatement": {
                  "id": 3, "name": "branch", "type": "SELECTION",
                  "guards": [{"condition": "x > 1"}, {"condition": "x <= 1"}],
                  "commands": [
                    {"id": 4, "name": "s4", "type": "STATEMENT", "programStatement": "x = x - 1;",
                     "preCondition": {"condition": "pre4"}},
                    {"id": 5, "name": "s5", "type": "SKIP"}
                  ]
                }
              }
            }
          },
          "files": [{"path": "Demo.java", "content": "class Demo {}"}],
          "settings": {"threshold": "50", "verbose": true}
        }
        """;

    private static StandInVerifier verifier;
    private static HttpClient httpClient;
    private static final JsonMapper JSON = JsonMapper.createDefault();

    @BeforeAll
    static void startStandInVerifier() throws InterruptedException {
        verifier = new StandInVerifier();
        httpClient = HttpClient.create(null);
    }

    @AfterAll
    static void stopStandInVerifier() throws InterruptedException {
        httpClient.close();
        verifier.close();
    }

    @BeforeEach
    void reset() {
        verifier.reset();
    }

    private static HttpVerifierClient clientFor(String id, String url) {
        VerifierRegistryEntry entry = new VerifierRegistryEntry(0);
        entry.setId(id);
        entry.setUrl(url);
        return new HttpVerifierClient(new VerifierRegistry(List.of(entry)), httpClient, JSON,
            new DefaultHttpClientConfiguration());
    }

    private static HttpVerifierClient mock() {
        return clientFor("mock", verifier.url("/mock"));
    }

    private static int closedPort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            return socket.getLocalPort();
        }
    }

    private static JobCondition condition(String condition) {
        return new JobCondition(condition);
    }

    /** A start request whose program nests every statement kind once, ids 0..5. */
    private static StartJobRequest startRequest() {
        JobStatement statement = JobStatement.composition(0, "root", null, null, condition("mid"),
            JobStatement.statement(1, "s1", null, null, "x = 1;"),
            JobStatement.repetition(2, "loop", null, null, condition("x > 0"), condition("x >= 0"), condition("x"),
                JobStatement.selection(3, "branch", null, null, List.of(condition("x > 1"), condition("x <= 1")), List.of(
                    JobStatement.statement(4, "s4", condition("pre4"), null, "x = x - 1;"),
                    JobStatement.skip(5, "s5", null, null)))));
        JobProgram program = new JobProgram("demo", List.of("int x"), condition("energy <= energyBudget"), null, statement);
        return new StartJobRequest(program, List.of(new SourceFile("Demo.java", "class Demo {}")),
            Map.of("threshold", JsonNode.createStringNode("50"), "verbose", JsonNode.createBooleanNode(true)));
    }

    // --- Start a job --------------------------------------------------------------------------

    @Test
    void startsTheJobUnderTheBackendMintedIdWithTheRequestAsJson() throws Exception {
        verifier.serve("POST", JOB_PATH, new StandInVerifier.Response(202, "text/plain", ""));

        mock().startJob("mock", JOB, startRequest());

        Assertions.assertEquals(1, verifier.requests().size(), "One acknowledged POST and nothing else");
        StandInVerifier.Request request = verifier.requests().get(0);
        Assertions.assertEquals("POST", request.method());
        Assertions.assertEquals(JOB_PATH, request.path(), "The id is resolved through the Registry, the job id appended");
        Assertions.assertTrue(request.contentType().startsWith("application/json"), request.contentType());
        Assertions.assertEquals(JSON.readValue(EXPECTED_START_BODY, JsonNode.class), JSON.readValue(request.body(), JsonNode.class),
            "The body is the start request per the contract: nulls omitted, ids numeric, settings as sent, "
                + "was: " + request.body());
    }

    @Test
    void startServerErrorIsUnreachable() {
        verifier.serve("POST", JOB_PATH, new StandInVerifier.Response(503, PROBLEM, "{\"status\": 503}"));

        VerifierUnreachableException e = Assertions.assertThrows(VerifierUnreachableException.class,
            () -> mock().startJob("mock", JOB, startRequest()));

        Assertions.assertTrue(e.getMessage().contains("mock") && e.getMessage().contains("503"), e.getMessage());
    }

    @Test
    void startClientErrorIsAnInvalidResponse() {
        verifier.serve("POST", JOB_PATH, new StandInVerifier.Response(400, PROBLEM,
            "{\"type\": \"about:blank\", \"title\": \"Malformed Request Body\", \"status\": 400}"));

        InvalidVerifierResponseException e = Assertions.assertThrows(InvalidVerifierResponseException.class,
            () -> mock().startJob("mock", JOB, startRequest()));

        Assertions.assertTrue(e.getMessage().contains("mock") && e.getMessage().contains("400"), e.getMessage());
    }

    @Test
    void startClientErrorIncludesTheProblemDetailInTheMessage() {
        verifier.serve("POST", JOB_PATH, new StandInVerifier.Response(400, PROBLEM,
            "{\"type\": \"about:blank\", \"title\": \"Malformed Request Body\", \"status\": 400, "
                + "\"detail\": \"Request body is missing required field 'files'\"}"));

        InvalidVerifierResponseException e = Assertions.assertThrows(InvalidVerifierResponseException.class,
            () -> mock().startJob("mock", JOB, startRequest()));

        Assertions.assertTrue(
            e.getMessage().contains("Request body is missing required field 'files'"), e.getMessage());
    }

    @Test
    void startConnectionRefusedIsUnreachable() throws IOException {
        HttpVerifierClient client = clientFor("mock", "http://127.0.0.1:" + closedPort());

        VerifierUnreachableException e = Assertions.assertThrows(VerifierUnreachableException.class,
            () -> client.startJob("mock", JOB, startRequest()));

        Assertions.assertTrue(e.getMessage().contains("mock"), e.getMessage());
        Assertions.assertTrue(verifier.requests().isEmpty(), "Nothing reached the stand-in");
    }

    @Test
    void startForAnUnregisteredIdIsAProgrammingError() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> mock().startJob("nope", JOB, startRequest()));
        Assertions.assertTrue(verifier.requests().isEmpty());
    }

    // --- Fetch the result ---------------------------------------------------------------------

    @Test
    void fetchesTheResultAsAFlatMapKeyedByStatementId() throws Exception {
        verifier.serveJson("GET", RESULT_PATH, """
            {"0": {"proven": true, "status": "Energy 3.2 J within budget"}, "1": {"proven": false}}
            """);

        Map<String, StatementResult> result = mock().fetchResult("mock", JOB);

        Assertions.assertEquals(List.of(RESULT_PATH), verifier.requestedPaths());
        Assertions.assertEquals(Map.of(
            "0", new StatementResult(true, "Energy 3.2 J within budget"),
            "1", new StatementResult(false, null)), result);
    }

    @Test
    void resultServerErrorIsUnreachable() {
        verifier.serve("GET", RESULT_PATH, new StandInVerifier.Response(500, PROBLEM, "{\"status\": 500}"));

        VerifierUnreachableException e = Assertions.assertThrows(VerifierUnreachableException.class,
            () -> mock().fetchResult("mock", JOB));

        Assertions.assertTrue(e.getMessage().contains("mock") && e.getMessage().contains("500"), e.getMessage());
    }

    @Test
    void resultClientErrorIsAnInvalidResponse() {
        verifier.serve("GET", RESULT_PATH, new StandInVerifier.Response(409, PROBLEM, "{\"status\": 409}"));

        InvalidVerifierResponseException e = Assertions.assertThrows(InvalidVerifierResponseException.class,
            () -> mock().fetchResult("mock", JOB));

        Assertions.assertTrue(e.getMessage().contains("mock") && e.getMessage().contains("409"), e.getMessage());
    }

    // --- Stream the status --------------------------------------------------------------------

    private static final String LOG_A = "{\"type\": \"log\", \"message\": \"analysing program\"}";
    private static final String LOG_B = "{\"type\": \"log\", \"message\": \"all statements checked\"}";
    private static final String DONE_PROVEN = "{\"type\": \"done\", \"proven\": true}";
    private static final String DONE_FAILED = "{\"type\": \"done\", \"proven\": false}";
    private static final String DONE_WITH_STATUS = "{\"type\": \"done\", \"proven\": true, \"status\": \"3.2 J for the whole run\"}";

    private static StandInVerifier.StatusScript script(Integer closeCode, String... messages) {
        return new StandInVerifier.StatusScript(List.of(messages), closeCode);
    }

    @Test
    void deliversEveryLogMessageInOrderAndReturnsTheDone() throws Exception {
        verifier.stream(JOB_PATH, script(1000, LOG_A, LOG_B, DONE_PROVEN));
        List<String> logs = new ArrayList<>();

        StatusMessage.Done done = mock().streamStatus("mock", JOB, log -> logs.add(log.message()));

        Assertions.assertEquals(new StatusMessage.Done(true, null), done, "A Verifier with nothing to say sends no status");
        Assertions.assertEquals(List.of("analysing program", "all statements checked"), logs);
        Assertions.assertEquals(1, verifier.requests().size());
        StandInVerifier.Request request = verifier.requests().get(0);
        Assertions.assertEquals("GET", request.method());
        Assertions.assertEquals(JOB_PATH, request.path(), "The stream is addressed by the same job id");
        Assertions.assertTrue(request.upgrade(), "Opened as a WebSocket");
    }

    @Test
    void logsAreDeliveredOnTheCallingThread() throws Exception {
        verifier.stream(JOB_PATH, script(1000, LOG_A, DONE_FAILED));
        List<Thread> deliveredOn = new ArrayList<>();

        StatusMessage.Done done = mock().streamStatus("mock", JOB, log -> deliveredOn.add(Thread.currentThread()));

        Assertions.assertEquals(new StatusMessage.Done(false, null), done, "The verdict is returned as sent");
        Assertions.assertEquals(List.of(Thread.currentThread()), deliveredOn,
            "The caller needs no synchronization: messages arrive on its own thread, in order");
    }

    @Test
    void returnsOnDoneWithoutWaitingForTheVerifierToClose() throws Exception {
        verifier.stream(JOB_PATH, script(null, DONE_PROVEN));

        StatusMessage.Done done = Assertions.assertTimeoutPreemptively(Duration.ofSeconds(5),
            () -> mock().streamStatus("mock", JOB, log -> { }),
            "A Verifier that leaves the stream open after done must not keep the caller waiting");

        Assertions.assertTrue(done.proven());
    }

    @Test
    void theVerifiersOwnWholeRunStatusIsCarriedAlongWithTheVerdict() throws Exception {
        verifier.stream(JOB_PATH, script(1000, LOG_A, DONE_WITH_STATUS));

        StatusMessage.Done done = mock().streamStatus("mock", JOB, log -> { });

        Assertions.assertEquals(new StatusMessage.Done(true, "3.2 J for the whole run"), done);
    }

    @Test
    void streamClosedBeforeDoneIsUnreachable() {
        verifier.stream(JOB_PATH, script(1000, LOG_A));
        List<String> logs = new ArrayList<>();

        VerifierUnreachableException e = Assertions.assertThrows(VerifierUnreachableException.class,
            () -> mock().streamStatus("mock", JOB, log -> logs.add(log.message())));

        Assertions.assertTrue(e.getMessage().contains("mock"), e.getMessage());
        Assertions.assertEquals(List.of("analysing program"), logs, "What arrived before the close was still delivered");
    }

    @Test
    void messageThatIsNotAStatusMessageIsAnInvalidResponse() {
        Map<String, String> messages = Map.of(
            "not-json", "not json",
            "scalar", "\"a bare string\"",
            "unknown-type", "{\"type\": \"progress\", \"message\": \"50%\"}",
            "no-type", "{\"message\": \"untyped\"}",
            "log-without-message", "{\"type\": \"log\"}",
            "done-without-proven", "{\"type\": \"done\"}",
            "done-with-string-proven", "{\"type\": \"done\", \"proven\": \"true\"}",
            "done-with-non-string-status", "{\"type\": \"done\", \"proven\": true, \"status\": 3}");

        for (Map.Entry<String, String> message : messages.entrySet()) {
            String path = "/mock/jobs/" + UUID.nameUUIDFromBytes(message.getKey().getBytes(StandardCharsets.UTF_8));
            verifier.stream(path, script(null, LOG_A, message.getValue(), DONE_PROVEN));
            UUID jobId = UUID.fromString(path.substring("/mock/jobs/".length()));

            InvalidVerifierResponseException e = Assertions.assertThrows(InvalidVerifierResponseException.class,
                () -> mock().streamStatus("mock", jobId, log -> { }), message.getKey());

            Assertions.assertTrue(e.getMessage().contains("mock"), message.getKey() + ": " + e.getMessage());
        }
    }

    @Test
    void refusedUpgradeIsClassifiedByItsStatus() {
        verifier.serve("GET", JOB_PATH, new StandInVerifier.Response(404, PROBLEM, "{\"status\": 404}"));

        InvalidVerifierResponseException invalid = Assertions.assertThrows(InvalidVerifierResponseException.class,
            () -> mock().streamStatus("mock", JOB, log -> { }));
        Assertions.assertTrue(invalid.getMessage().contains("mock") && invalid.getMessage().contains("404"),
            invalid.getMessage());

        verifier.serve("GET", JOB_PATH, new StandInVerifier.Response(503, PROBLEM, "{\"status\": 503}"));

        VerifierUnreachableException unreachable = Assertions.assertThrows(VerifierUnreachableException.class,
            () -> mock().streamStatus("mock", JOB, log -> { }));
        Assertions.assertTrue(unreachable.getMessage().contains("mock") && unreachable.getMessage().contains("503"),
            unreachable.getMessage());
    }

    @Test
    void streamConnectionRefusedIsUnreachable() throws IOException {
        HttpVerifierClient client = clientFor("mock", "http://127.0.0.1:" + closedPort());

        VerifierUnreachableException e = Assertions.assertThrows(VerifierUnreachableException.class,
            () -> client.streamStatus("mock", JOB, log -> { }));

        Assertions.assertTrue(e.getMessage().contains("mock"), e.getMessage());
        Assertions.assertTrue(verifier.requests().isEmpty(), "Nothing reached the stand-in");
    }

    @Test
    void streamForAnUnregisteredIdIsAProgrammingError() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> mock().streamStatus("nope", JOB, log -> { }));
        Assertions.assertTrue(verifier.requests().isEmpty());
    }

    @Test
    void resultBodyThatDoesNotFitTheContractIsAnInvalidResponse() {
        Map<String, String> bodies = Map.of(
            "html", "<html>not a verifier</html>",
            "array", "[]",
            "empty", "",
            "no-proven", "{\"0\": {\"status\": \"no verdict\"}}",
            "scalar-entry", "{\"0\": true}");

        for (Map.Entry<String, String> body : bodies.entrySet()) {
            verifier.serveJson("GET", RESULT_PATH, body.getValue());

            Assertions.assertThrows(InvalidVerifierResponseException.class, () -> mock().fetchResult("mock", JOB),
                body.getKey());
        }
    }
}
