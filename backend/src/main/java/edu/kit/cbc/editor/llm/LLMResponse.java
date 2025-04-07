package edu.kit.cbc.editor.llm;

import io.micronaut.serde.annotation.Serdeable;

import java.util.List;

@Serdeable
public record LLMResponse(List<LLMResponseOutput> output) {
    @Serdeable
    public record LLMResponseOutput(List<LLMResponseOutputContent> content) {
    }

    @Serdeable
    public record LLMResponseOutputContent(String text) {
    }
}
