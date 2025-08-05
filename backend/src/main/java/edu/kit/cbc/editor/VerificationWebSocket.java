package edu.kit.cbc.editor;

import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.ExecuteOn;
import io.micronaut.websocket.WebSocketSession;
import io.micronaut.websocket.annotation.OnClose;
import io.micronaut.websocket.annotation.OnMessage;
import io.micronaut.websocket.annotation.OnOpen;
import io.micronaut.websocket.annotation.ServerWebSocket;
import java.util.UUID;

@ServerWebSocket("/ws/verify/{jobId}")
@ExecuteOn(TaskExecutors.BLOCKING)
public class VerificationWebSocket {
    private final VerificationOrchestrator orchestrator;

    public VerificationWebSocket(VerificationOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @OnOpen
    public void onOpen(UUID jobId, WebSocketSession session) {
        boolean success = orchestrator.addListener(jobId, (msg) -> {
            if (!session.isOpen()) {
                return true;
            }
            session.sendSync(msg);
            return false;
        });

        if (!success) {
            session.sendSync(String.format("job not found %s", jobId));
            session.close();
            return;
        }
        session.sendSync(orchestrator.getJobLog(jobId));
    }

    @OnMessage
    public void onMessage(UUID jobId, String message, WebSocketSession session) {
        /*unused*/
    }

    @OnClose
    public void onClose(UUID jobId, WebSocketSession session) {
        /*unused*/
    }
}
