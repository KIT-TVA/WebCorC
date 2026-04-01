package edu.kit.cbc.editor.llm;

public interface LLMClient {
    LLMProvider getProvider();
    LLMResponse sendQuery(LLMQueryDto query);
}
