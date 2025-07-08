package edu.kit.cbc.common.corc.parsing.lexer;

public interface Token {
    default int position() {
        return -1;
    }
}
