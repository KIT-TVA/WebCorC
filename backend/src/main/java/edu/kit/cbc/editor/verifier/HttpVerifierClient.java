package edu.kit.cbc.editor.verifier;

import edu.kit.cbc.common.Problem;
import edu.kit.cbc.editor.verifier.job.StartJobRequest;
import edu.kit.cbc.editor.verifier.job.StatementResult;
import edu.kit.cbc.editor.verifier.job.StatusMessage;
import io.micronaut.core.type.Argument;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.MediaType;
import io.micronaut.http.MutableHttpRequest;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.HttpClientConfiguration;
import io.micronaut.http.client.exceptions.HttpClientException;
import io.micronaut.http.client.exceptions.HttpClientResponseException;
import io.micronaut.json.JsonMapper;
import io.micronaut.json.tree.JsonNode;
import jakarta.inject.Singleton;
import java.io.IOException;
import java.net.URI;
import java.net.http.WebSocket;
import java.net.http.WebSocketHandshakeException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletionException;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.function.Consumer;

/**
 * The {@link VerifierClient} over HTTP: the single place in the backend where a Verifier id is
 * turned into a URL. The base URL comes from the Verifier's {@link VerifierRegistryEntry}; the
 * operation paths of the Verifier API ({@code openapi/verifier-api.yml}) are appended to it.
 *
 * <p>Failures are classified as the contract promises: a connection failure, a timeout or a
 * 5xx status is <em>unreachable</em>; any other non-2xx status — including one {@link HttpStatus}
 * does not recognize — or a body that does not parse to the operation's schema is an
 * <em>invalid response</em>, and so is a Registry entry whose URL is not syntactically valid.
 * A body is fetched as text and parsed separately so that the two classifications cannot bleed
 * into each other.
 *
 * <p>The HTTP operations use the application's default Micronaut HTTP client (and therefore its
 * {@code micronaut.http.client} timeouts) with absolute request URIs; the client is not bound
 * to any base URL. The status stream uses the JDK's own WebSocket client, sharing the
 * configured connect timeout: it needs no bean context, and a stream has no read timeout by
 * design (a Verifier may be silent for as long as its run takes).
 */
@Singleton
public class HttpVerifierClient implements VerifierClient {

    /** Path of the Self-Description operation, relative to the registered base URL. */
    static final String DESCRIPTION_PATH = "/description";
    /** Prefix of the job operations' paths; the job id follows. */
    static final String JOBS_PATH = "/jobs/";
    /** Suffix of the result operation's path, after the job id. */
    static final String RESULT_PATH = "/result";

    private final VerifierRegistry registry;
    private final HttpClient httpClient;
    private final JsonMapper jsonMapper;
    private final java.net.http.HttpClient webSocketClient;

    public HttpVerifierClient(
        VerifierRegistry registry, HttpClient httpClient, JsonMapper jsonMapper, HttpClientConfiguration configuration
    ) {
        this.registry = registry;
        this.httpClient = httpClient;
        this.jsonMapper = jsonMapper;
        java.net.http.HttpClient.Builder builder = java.net.http.HttpClient.newBuilder();
        configuration.getConnectTimeout().ifPresent(builder::connectTimeout);
        this.webSocketClient = builder.build();
    }

    @Override
    public SelfDescription describe(String id) throws VerifierUnreachableException, InvalidVerifierResponseException {
        URI uri = operationUri(id, DESCRIPTION_PATH);
        String body = exchange(id, HttpRequest.GET(uri).accept(MediaType.APPLICATION_JSON_TYPE), "a Self-Description");
        try {
            SelfDescription description = jsonMapper.readValue(body, SelfDescription.class);
            if (description == null) {
                throw new InvalidVerifierResponseException(
                    "Verifier '" + id + "' answered GET " + DESCRIPTION_PATH + " with an empty Self-Description", null);
            }
            return description;
        } catch (IOException e) {
            throw new InvalidVerifierResponseException(
                "Verifier '" + id + "' answered GET " + DESCRIPTION_PATH
                    + " with a body that is not a Self-Description: " + e.getMessage(), e);
        }
    }

    @Override
    public void startJob(String id, UUID jobId, StartJobRequest request)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        URI uri = operationUri(id, JOBS_PATH + jobId);
        String body;
        try {
            body = jsonMapper.writeValueAsString(request);
        } catch (IOException e) {
            throw new IllegalArgumentException(
                "Start request for Verifier '" + id + "' cannot be serialized: " + e.getMessage(), e);
        }
        exchange(id, HttpRequest.POST(uri, body).contentType(MediaType.APPLICATION_JSON_TYPE), "an acknowledgement");
    }

    @Override
    public StatusMessage.Done streamStatus(String id, UUID jobId, Consumer<StatusMessage.Log> onLog)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        String path = JOBS_PATH + jobId;
        URI uri = webSocketUri(id, operationUri(id, path));
        String stream = "the status stream GET " + path;
        StatusStreamListener listener = new StatusStreamListener();
        WebSocket socket = open(id, stream, uri, listener);
        try {
            while (true) {
                switch (listener.next()) {
                    case StatusStreamListener.Text text -> {
                        switch (parseStatusMessage(id, stream, text.message())) {
                            case StatusMessage.Log log -> onLog.accept(log);
                            case StatusMessage.Done done -> {
                                socket.sendClose(WebSocket.NORMAL_CLOSURE, "done");
                                return done;
                            }
                        }
                    }
                    case StatusStreamListener.Closed closed -> throw new VerifierUnreachableException(
                        "Verifier '" + id + "' closed " + stream + " (" + closed.code() + ") before sending done", null);
                    case StatusStreamListener.Failed failed -> throw new VerifierUnreachableException(
                        "Verifier '" + id + "' dropped " + stream + ": " + failed.cause().getMessage(), failed.cause());
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            socket.abort();
            throw new VerifierUnreachableException("Interrupted while waiting on " + stream + " of Verifier '" + id + "'", e);
        } catch (VerifierClientException e) {
            socket.abort();
            throw e;
        }
    }

    private StatusMessage parseStatusMessage(String id, String stream, String text) throws InvalidVerifierResponseException {
        String answered = "Verifier '" + id + "' sent on " + stream + " a message that is not a status message";
        try {
            return StatusMessage.parse(jsonMapper.readValue(text, JsonNode.class));
        } catch (IOException e) {
            throw new InvalidVerifierResponseException(answered + " (not JSON): " + e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            throw new InvalidVerifierResponseException(answered + ": " + e.getMessage(), e);
        }
    }

    /** The same operation URI under the WebSocket scheme matching its HTTP one. */
    private static URI webSocketUri(String id, URI http) throws InvalidVerifierResponseException {
        String scheme = http.getScheme() == null ? "" : http.getScheme().toLowerCase(Locale.ROOT);
        String webSocketScheme = switch (scheme) {
            case "http", "ws" -> "ws";
            case "https", "wss" -> "wss";
            default -> throw new InvalidVerifierResponseException(
                "Verifier '" + id + "' is registered with a URL that is not http(s): '" + http + "'", null);
        };
        return URI.create(webSocketScheme + http.toString().substring(scheme.length()));
    }

    /** Opens the WebSocket, classifying a failure to do so the way {@link #exchange} does. */
    private WebSocket open(String id, String stream, URI uri, StatusStreamListener listener)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        try {
            return webSocketClient.newWebSocketBuilder().buildAsync(uri, listener).join();
        } catch (CompletionException e) {
            Throwable cause = e.getCause() == null ? e : e.getCause();
            if (cause instanceof WebSocketHandshakeException handshake && handshake.getResponse() != null) {
                int code = handshake.getResponse().statusCode();
                String answered = "Verifier '" + id + "' answered " + code + " to " + stream;
                if (code >= HttpStatus.INTERNAL_SERVER_ERROR.getCode()) {
                    throw new VerifierUnreachableException(answered, handshake);
                }
                throw new InvalidVerifierResponseException(answered + " instead of opening it", handshake);
            }
            if (cause instanceof IOException) {
                throw new VerifierUnreachableException(
                    "Verifier '" + id + "' could not be reached for " + stream + ": " + cause.getMessage(), cause);
            }
            throw new InvalidVerifierResponseException(
                "Verifier '" + id + "' could not be asked for " + stream + ": " + cause, cause);
        }
    }

    /**
     * Receives the WebSocket's events on the JDK client's thread and queues them for the
     * calling thread, so that log messages are delivered there in order. Text messages may
     * arrive in parts and are reassembled; a binary message is passed on as UTF-8 text, where
     * it fails to parse like any other non-JSON message.
     */
    private static final class StatusStreamListener implements WebSocket.Listener {

        sealed interface Event permits Text, Closed, Failed {}

        record Text(String message) implements Event {}

        record Closed(int code, String reason) implements Event {}

        record Failed(Throwable cause) implements Event {}

        private final BlockingQueue<Event> events = new LinkedBlockingQueue<>();
        private final StringBuilder partial = new StringBuilder();

        Event next() throws InterruptedException {
            return events.take();
        }

        @Override
        public CompletionStage<?> onText(WebSocket socket, CharSequence data, boolean last) {
            partial.append(data);
            if (last) {
                events.add(new Text(partial.toString()));
                partial.setLength(0);
            }
            socket.request(1);
            return null;
        }

        @Override
        public CompletionStage<?> onBinary(WebSocket socket, ByteBuffer data, boolean last) {
            partial.append(StandardCharsets.UTF_8.decode(data));
            if (last) {
                events.add(new Text(partial.toString()));
                partial.setLength(0);
            }
            socket.request(1);
            return null;
        }

        @Override
        public CompletionStage<?> onClose(WebSocket socket, int statusCode, String reason) {
            events.add(new Closed(statusCode, reason));
            return null;
        }

        @Override
        public void onError(WebSocket socket, Throwable error) {
            events.add(new Failed(error));
        }
    }

    @Override
    public Map<String, StatementResult> fetchResult(String id, UUID jobId)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        String path = JOBS_PATH + jobId + RESULT_PATH;
        URI uri = operationUri(id, path);
        String body = exchange(id, HttpRequest.GET(uri).accept(MediaType.APPLICATION_JSON_TYPE), "a result");
        String answered = "Verifier '" + id + "' answered GET " + path + " with ";
        Map<String, StatementResult> result;
        try {
            result = jsonMapper.readValue(body, Argument.mapOf(String.class, StatementResult.class));
        } catch (IOException e) {
            throw new InvalidVerifierResponseException(answered + "a body that is not a result: " + e.getMessage(), e);
        }
        if (result == null) {
            throw new InvalidVerifierResponseException(answered + "an empty result", null);
        }
        for (Map.Entry<String, StatementResult> entry : result.entrySet()) {
            if (entry.getValue() == null || entry.getValue().proven() == null) {
                throw new InvalidVerifierResponseException(
                    answered + "a result whose statement '" + entry.getKey() + "' has no proven verdict", null);
            }
        }
        return Map.copyOf(result);
    }

    /**
     * Resolves the Verifier's base URL through the Registry and appends an operation path.
     *
     * @param id the Verifier's Registry id
     * @param operationPath a Verifier API path starting with {@code /}
     * @return the absolute URI of the operation
     * @throws IllegalArgumentException if no Verifier is registered under {@code id} — a
     *     programming error, since the caller always got {@code id} from the same Registry
     * @throws InvalidVerifierResponseException if the Registry entry's URL is not syntactically
     *     valid once the operation path is appended — a Registry misconfiguration, not retried
     */
    private URI operationUri(String id, String operationPath) throws InvalidVerifierResponseException {
        VerifierRegistryEntry entry = registry.entry(id)
            .orElseThrow(() -> new IllegalArgumentException("Verifier '" + id + "' is not registered"));
        String base = entry.getUrl();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String target = base + operationPath;
        try {
            return URI.create(target);
        } catch (IllegalArgumentException e) {
            throw new InvalidVerifierResponseException(
                "Verifier '" + id + "' is registered with a malformed URL '" + target + "': " + e.getMessage(), e);
        }
    }

    /**
     * Sends one HTTP request and returns the response body as text, classifying a failure:
     * {@code expected} names what the operation should have answered with, for the message.
     */
    private String exchange(String id, MutableHttpRequest<?> request, String expected)
        throws VerifierUnreachableException, InvalidVerifierResponseException {
        String operation = request.getMethodName() + " " + request.getPath();
        try {
            HttpResponse<String> response = httpClient.toBlocking().exchange(request, String.class);
            return response.getBody().orElse("");
        } catch (HttpClientResponseException e) {
            // The raw code, not e.getStatus(): a non-standard code (e.g. Cloudflare 520-527) has
            // no HttpStatus constant and getStatus() throws IllegalArgumentException on lookup.
            int code = e.getResponse().code();
            String answered = "Verifier '" + id + "' answered " + code + " to " + operation;
            if (code >= HttpStatus.INTERNAL_SERVER_ERROR.getCode()) {
                throw new VerifierUnreachableException(answered, e);
            }
            throw new InvalidVerifierResponseException(answered + " instead of " + expected + reason(e), e);
        } catch (HttpClientException e) {
            throw new VerifierUnreachableException(
                "Verifier '" + id + "' could not be reached for " + operation + ": " + e.getMessage(), e);
        }
    }

    /**
     * The Verifier's own explanation for an error response, as {@code ": <explanation>"}: the
     * {@code problem+json} body's {@code detail}, falling back to its {@code title}, or the raw
     * body (trimmed to 200 characters) if it does not parse as a Problem. Empty when the
     * response carries no body.
     */
    private String reason(HttpClientResponseException e) {
        String body = e.getResponse().getBody(String.class).orElse("");
        if (body.isBlank()) {
            return "";
        }
        try {
            Problem problem = jsonMapper.readValue(body, Problem.class);
            if (problem.detail() != null && !problem.detail().isBlank()) {
                return ": " + problem.detail();
            }
            if (problem.title() != null && !problem.title().isBlank()) {
                return ": " + problem.title();
            }
        } catch (IOException ignored) {
            // Not a parseable problem+json body; fall through to the raw body below.
        }
        String trimmed = body.trim();
        return ": " + (trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed);
    }
}
