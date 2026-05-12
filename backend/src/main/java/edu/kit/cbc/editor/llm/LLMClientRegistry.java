package edu.kit.cbc.editor.llm;

import jakarta.inject.Singleton;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Singleton
public class LLMClientRegistry {
    private final Map<LLMProvider, LLMClient> clients;

    public LLMClientRegistry(List<LLMClient> clientList) {
        this.clients = clientList.stream()
                .collect(Collectors.toMap(LLMClient::getProvider, c -> c));
    }

    public LLMClient getClient(LLMProvider provider) {
        LLMClient client = clients.get(provider);
        if (client == null) {
            throw new IllegalArgumentException("Unsupported provider: " + provider);
        }
        return client;
    }
}
