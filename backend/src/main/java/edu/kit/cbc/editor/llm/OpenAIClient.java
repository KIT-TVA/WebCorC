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
public class OpenAIClient implements LLMClient {
    private static final String OPENAI_API_URI = "https://api.openai.com/v1/";
    private static final Logger LOGGER = Logger.getGlobal();
    private final String accessToken;
    private final HttpClient httpClient;

    public OpenAIClient(
            @Property(name = "openai.accessToken") String accessToken, HttpClient httpClient
    ) {
        this.accessToken = accessToken;
        this.httpClient = httpClient;
    }

    @Override
    public LLMProvider getProvider() {
        return LLMProvider.OPENAI;
    }

    @Override
    public LLMResponse sendQuery(LLMQueryDto query) {
        var body = Map.of(
                "model", query.model(),
                "input", query.input().stream()
                        .map(i -> Map.of("role", i.role(), "content", i.content()))
                        .toList()
        );

        HttpRequest<Map<String, Object>> req = HttpRequest.POST(OPENAI_API_URI + "responses", body)
                .bearerAuth(accessToken);
        LOGGER.info(String.format("OpenAI Query: %s", query.input()));

        OpenAIResponseBody response = httpClient.toBlocking().retrieve(req, OpenAIResponseBody.class);
        String text = response.output().getFirst().content().getFirst().text();
        return new LLMResponse(text);
    }

    @Serdeable
    record OpenAIResponseBody(List<OpenAIOutput> output) {
        @Serdeable
        record OpenAIOutput(List<OpenAIOutputContent> content) {}
        @Serdeable
        record OpenAIOutputContent(String text) {}
    }
}
