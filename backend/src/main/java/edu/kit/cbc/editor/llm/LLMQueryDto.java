package edu.kit.cbc.editor.llm;

import java.util.List;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Serdeable
public record LLMQueryDto(@NotNull @Valid List<LLMQueryInput> input, @Pattern(regexp = "gpt-4-turbo") String model) {
    @Serdeable
    public record LLMQueryInput(@NotBlank String content, @Pattern(regexp = "user") String role) {
        private static final int TOKEN_LIMIT = 3800; //Taken from CorC
        public LLMQueryInput {
            if ((content.length() / 4) > TOKEN_LIMIT) {
                throw new IllegalArgumentException("Token limit exceeded. Please shorten the input");
            }
        }
    }
}
