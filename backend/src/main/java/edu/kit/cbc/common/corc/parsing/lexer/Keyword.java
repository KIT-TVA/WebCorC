package edu.kit.cbc.common.corc.parsing.lexer;

public record Keyword(KeywordType type) implements Token {

    public enum KeywordType {
        INT("int");

        private final String value;

        KeywordType(String value) {
            this.value = value;
        }

        @Override
        public String toString() {
            return this.value;
        }
    }
}
