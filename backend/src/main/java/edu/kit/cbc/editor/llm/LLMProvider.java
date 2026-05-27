package edu.kit.cbc.editor.llm;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public enum LLMProvider {
    OPENAI, ANTHROPIC, XAI, GOOGLE
}
