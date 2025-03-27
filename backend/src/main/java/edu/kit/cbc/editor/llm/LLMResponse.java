package edu.kit.cbc.editor.llm;

import java.util.List;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record LLMResponse(List<LLMResponseOutput> output) {
    @Serdeable
    public record LLMResponseOutput(List<LLMResponseOutputContent> content) {}

    @Serdeable
    public record LLMResponseOutputContent(String text) {}
}
