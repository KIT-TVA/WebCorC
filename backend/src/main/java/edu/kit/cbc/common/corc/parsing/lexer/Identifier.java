package edu.kit.cbc.common.corc.parsing.lexer;

public record Identifier(String identifier, int pos) implements Token {
    @Override
    public int position() {
        return pos();
    }
}
