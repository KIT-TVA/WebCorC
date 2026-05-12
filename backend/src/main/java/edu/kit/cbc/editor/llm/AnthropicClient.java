package edu.kit.cbc.editor.llm;

import io.micronaut.context.annotation.Property;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.MutableHttpRequest;
import io.micronaut.http.client.HttpClient;
import io.micronaut.serde.annotation.Serdeable;
import jakarta.inject.Singleton;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Singleton
public class AnthropicClient implements LLMClient {
    private static final String ANTHROPIC_API_URI = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final Logger LOGGER = Logger.getGlobal();
    private final String accessToken;
    private final HttpClient httpClient;

    public AnthropicClient(
            @Property(name = "anthropic.accessToken") String accessToken, HttpClient httpClient
    ) {
        this.accessToken = accessToken;
        this.httpClient = httpClient;
    }

    @Override
    public LLMProvider getProvider() {
        return LLMProvider.ANTHROPIC;
    }

    @Override
    public LLMResponse sendQuery(LLMQueryDto query) {
        var messages = query.input().stream()
                .map(i -> Map.of("role", i.role(), "content", i.content()))
                .toList();

        var body = Map.of(
                "model", query.model(),
                "max_tokens", 4096,
                "messages", messages
        );

        MutableHttpRequest<Map<String, Object>> req = HttpRequest.POST(ANTHROPIC_API_URI, body)
                .header("x-api-key", accessToken)
                .header("anthropic-version", ANTHROPIC_VERSION)
                .header("content-type", "application/json");
        LOGGER.info(String.format("Anthropic Query: %s", query.input()));

        AnthropicResponseBody response = httpClient.toBlocking().retrieve(req, AnthropicResponseBody.class);
        String text = response.content().getFirst().text();
        return new LLMResponse(text);
    }

    @Serdeable
    record AnthropicResponseBody(List<AnthropicContent> content) {
        @Serdeable
        record AnthropicContent(String type, String text) {}
    }
}
