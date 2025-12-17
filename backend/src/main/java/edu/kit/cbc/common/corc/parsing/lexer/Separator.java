package edu.kit.cbc.common.corc.parsing.lexer;

public record Separator(SeparatorType type, int pos) implements Token {

    @Override
    public int position() {
        return pos();
    }

    @Override
    public String toString() {
        return type().toString();
    }

    public enum SeparatorType {
        PAREN_OPEN("("),
        PAREN_CLOSE(")"),
        SEMICOLON(";"),
        COMMA(","),
        DOT("."),
        SQR_PAREN_OPEN("["),
        SQR_PAREN_CLOSE("]"),
        ;

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
