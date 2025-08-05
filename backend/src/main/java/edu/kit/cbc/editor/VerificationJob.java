package edu.kit.cbc.editor;

import java.util.HashSet;
import java.util.function.Function;
import lombok.Getter;

public class VerificationJob {
    @Getter
    private String log;
    private HashSet<Function<String, Boolean>> listeners;

    VerificationJob() {
        log = "";
        listeners = new HashSet<Function<String, Boolean>>();
    }

    public void addListener(Function<String, Boolean> listener) {
        listeners.add(listener);
    }

    public void log(String message) {
        log += message;

        //Call all listeners. The listener returns true if it detects that its WebSocket connection was closed,
        //so it will be removed from the listener pool
        listeners.removeIf(l -> l.apply(message));
    }
}
