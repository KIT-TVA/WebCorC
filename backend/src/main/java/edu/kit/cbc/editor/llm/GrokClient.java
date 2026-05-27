package edu.kit.cbc.editor.llm;

import io.micronaut.context.annotation.Property;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.client.HttpClient;
import io.micronaut.serde.annotation.Serdeable;
import jakarta.inject.Singleton;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Singleton
public class GrokClient implements LLMClient {
    private static final String XAI_API_URI = "https://api.x.ai/v1/chat/completions";
    private static final Logger LOGGER = Logger.getGlobal();
    private final String accessToken;
    private final HttpClient httpClient;

    public GrokClient(
            @Property(name = "xai.accessToken") String accessToken, HttpClient httpClient
    ) {
        this.accessToken = accessToken;
        this.httpClient = httpClient;
    }

    @Override
    public LLMProvider getProvider() {
        return LLMProvider.XAI;
    }

    @Override
    public LLMResponse sendQuery(LLMQueryDto query) {
        var messages = query.input().stream()
                .map(i -> Map.of("role", i.role(), "content", i.content()))
                .toList();

        var body = Map.of(
                "model", query.model(),
                "messages", messages
        );

        var req = HttpRequest.POST(XAI_API_URI, body)
                .bearerAuth(accessToken);
        LOGGER.info(String.format("Grok Query: %s", query.input()));

        GrokResponseBody response = httpClient.toBlocking().retrieve(req, GrokResponseBody.class);
        String text = response.choices().getFirst().message().content();
        return new LLMResponse(text);
    }

    @Serdeable
    record GrokResponseBody(List<GrokChoice> choices) {

        @Serdeable
        record GrokChoice(GrokMessage message) {}

        @Serdeable
        record GrokMessage(String role, String content) {}
    }
}
