package edu.kit.cbc.editor.llm;

import java.util.logging.Logger;

import io.micronaut.context.annotation.Property;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.client.HttpClient;
import jakarta.inject.Singleton;

@Singleton
public class OpenAIClient {
    private final String accessToken;
    private final static String OPENAI_API_URI = "https://api.openai.com/v1/";
    private final HttpClient httpClient;
    private Logger LOGGER = Logger.getGlobal();

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
