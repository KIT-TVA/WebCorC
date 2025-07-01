package edu.kit.cbc.common.corc.parsing.lexer;

public record Separator(SeparatorType type) implements Token {


    @Override
    public String toString() {
        return type().toString();
    }

    public enum SeparatorType {
        PAREN_OPEN("("),
        PAREN_CLOSE(")"),
        SEMICOLON(";");

        private final String value;

        SeparatorType(String value) {
            this.value = value;
        }

        @Override
        public String toString() {
            return this.value;
        }
    }
}
