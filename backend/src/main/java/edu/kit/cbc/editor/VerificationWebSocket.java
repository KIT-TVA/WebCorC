package edu.kit.cbc.editor;

import io.micronaut.json.JsonMapper;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import io.micronaut.websocket.CloseReason;
import io.micronaut.websocket.WebSocketSession;
import io.micronaut.websocket.annotation.OnClose;
import io.micronaut.websocket.annotation.OnMessage;
import io.micronaut.websocket.annotation.OnOpen;
import io.micronaut.websocket.annotation.ServerWebSocket;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.UUID;

/**
 * The frontend's one connection per verification job: every {@link VerificationMessage} of the
 * job as a JSON text frame, the history first for a connection opened late. A job id nobody
 * knows closes the socket with {@link #JOB_NOT_FOUND} instead of sending anything.
 */
@ServerWebSocket("/ws/verify/{jobId}")
@ExecuteOn(TaskExecutors.BLOCKING)
public class VerificationWebSocket {

    /** Application close code (4000–4999 are free for applications) for an unknown job id. */
    static final int JOB_NOT_FOUND = 4404;

    private final VerificationOrchestrator orchestrator;
    private final JsonMapper jsonMapper;

    public VerificationWebSocket(VerificationOrchestrator orchestrator, JsonMapper jsonMapper) {
        this.orchestrator = orchestrator;
        this.jsonMapper = jsonMapper;
    }

    @OnOpen
    public void onOpen(UUID jobId, WebSocketSession session) {
        boolean known = orchestrator.subscribe(jobId, message -> {
            if (!session.isOpen()) {
                return true;
            }
            String json = toJson(message);
            try {
                session.sendSync(json);
                return false;
            } catch (RuntimeException e) {
                // The connection went away between the check and the send: drop the listener.
                return true;
            }
        });
        if (!known) {
            session.close(new CloseReason(JOB_NOT_FOUND, "job " + jobId + " not found"));
        }
    }

    private String toJson(VerificationMessage message) {
        try {
            return jsonMapper.writeValueAsString(message);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @OnMessage
    public void onMessage(UUID jobId, String message, WebSocketSession session) {
        /*unused*/
    }

    @OnClose
    public void onClose(UUID jobId, WebSocketSession session) {
        if (session.isOpen()) {
            session.close();
        }
    }
}
