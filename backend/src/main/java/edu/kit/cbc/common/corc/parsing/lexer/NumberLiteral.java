package edu.kit.cbc.common.corc.parsing.lexer;

public record NumberLiteral(String value, int pos) implements Token {
    @Override
    public int position() {
        return pos();
    }
}
