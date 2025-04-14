package edu.kit.cbc.editor.llm;

import io.micronaut.context.annotation.Property;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.client.HttpClient;
import jakarta.inject.Singleton;
import java.util.logging.Logger;

@Singleton
public class OpenAIClient {
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

    public LLMResponse sendQuery(LLMQueryDto query) {
        HttpRequest<LLMQueryDto> req = HttpRequest.POST(OPENAI_API_URI + "responses", query)
                .bearerAuth(accessToken);
        LOGGER.info(String.format("LLM Query: %s", query.input()));
        return httpClient.toBlocking().retrieve(req, LLMResponse.class);
    }
}
