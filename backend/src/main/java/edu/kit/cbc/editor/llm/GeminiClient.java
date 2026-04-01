package edu.kit.cbc.editor.llm;

import io.micronaut.context.annotation.Property;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.exceptions.HttpClientResponseException;
import io.micronaut.serde.annotation.Serdeable;
import jakarta.inject.Singleton;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Singleton
public class GeminiClient implements LLMClient {
    private static final String GEMINI_API_URI = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final Logger LOGGER = Logger.getGlobal();
    private final String accessToken;
    private final HttpClient httpClient;

    public GeminiClient(
            @Property(name = "google.accessToken") String accessToken, HttpClient httpClient
    ) {
        this.accessToken = accessToken;
        this.httpClient = httpClient;
    }

    @Override
    public LLMProvider getProvider() {
        return LLMProvider.GOOGLE;
    }

    @Override
    public LLMResponse sendQuery(LLMQueryDto query) {
        var contents = query.input().stream()
                .map(i -> Map.of(
                        "role", mapRole(i.role()),
                        "parts", List.of(Map.of("text", i.content()))
                ))
                .toList();

        var body = Map.of("contents", contents);

        String url = GEMINI_API_URI + query.model() + ":generateContent?key=" + accessToken;
        var req = HttpRequest.POST(url, body);
        // #region agent log
        LOGGER.info(String.format("[GEMINI-DEBUG] Sending request to model: %s", query.model()));
        // #endregion
        LOGGER.info(String.format("Gemini Query: %s", query.input()));

        // #region agent log
        try {
            GeminiResponseBody response = httpClient.toBlocking().retrieve(req, GeminiResponseBody.class);
            LOGGER.info(String.format("[GEMINI-DEBUG] H-A/H-B: Response received, candidates count: %d",
                response.candidates() == null ? -1 : response.candidates().size()));
            String text = response.candidates().getFirst().content().parts().getFirst().text();
            LOGGER.info("[GEMINI-DEBUG] H-C: Text extracted successfully");
            return new LLMResponse(text);
        } catch (HttpClientResponseException e) {
            LOGGER.severe(String.format("[GEMINI-DEBUG] H-A CONFIRMED: HTTP %d from Gemini API. Body: %s",
                e.getStatus().getCode(), e.getResponse().getBody(String.class).orElse("<empty>")));
            throw e;
        } catch (Exception e) {
            LOGGER.severe(String.format("[GEMINI-DEBUG] H-B/H-C: Non-HTTP exception: %s: %s",
                e.getClass().getSimpleName(), e.getMessage()));
            throw e;
        }
        // #endregion
    }

    private String mapRole(String role) {
        return "assistant".equals(role) ? "model" : "user";
    }

    @Serdeable
    record GeminiResponseBody(List<GeminiCandidate> candidates) {
        @Serdeable
        record GeminiCandidate(GeminiContent content) {}
        @Serdeable
        record GeminiContent(List<GeminiPart> parts) {}
        @Serdeable
        record GeminiPart(String text) {}
    }
}
