package edu.kit.cbc.common.corc.parsing.lexer;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

public abstract class Lexer {

    private static final List<Character> WHITESPACE_TOKEN = List.of(' ', '\t');

    protected final String source;
    protected int pos;

    protected Lexer(String source) {
        this.source = source;
    }

    public abstract Optional<Token> nextToken();

    protected void skipWhiteSpace() {
        while(hasMore(0)) {
            if (!WHITESPACE_TOKEN.contains(peek())) {
                return;
            }
            this.pos++;
        }
    }

    protected boolean hasMore(int offset) {
        return this.pos + offset < this.source.length();
    }

    protected char peek() {
        return this.source.charAt(this.pos);
    }

    protected char peek(int offset) {
        return this.source.charAt(this.pos + offset);
    }

    protected String readIdentifierName() {
        int offset = 1;

        while (hasMore(offset) && isIdentifierChar(peek(offset))) {
            offset++;
        }

        return source.substring(pos, pos + offset);
    }

    protected Token lexIdentifier() {
        String name = readIdentifierName();
        advance(name.length());

        Optional<Keyword.KeywordType> matchingKeyWord = EnumSet.allOf(Keyword.KeywordType.class)
            .stream()
            .filter(type -> type.toString().equals(name))
            .findFirst();

        if (matchingKeyWord.isPresent()) {
            return new Keyword(matchingKeyWord.get());
        }

        return new Identifier(name);
    }

    protected Token lexIntLiteral() {
        int offset = 1;

        while (hasMore(offset) && isNumeric(peek(offset))) {
            offset++;
        }
        Token result = new NumberLiteral(this.source.substring(this.pos, this.pos + offset));

        advance(offset);

        return result;
    }

    protected boolean isIdentifierChar(char c)  {
        return '0' <= c && c <= '9'
            || 'A' <= c && c <= 'Z'
            || 'a' <= c && c <= 'z'
            || c == '_';
    }

    protected boolean isNumeric(char c ) {
        return '0' <= c && c <= '9';
    }

    protected Token lexDoubleOperator(char c, Token token) {
        if (peek() == c) {
            if (hasMore(1) && peek(1) == c) {
                return token;
            }
        }

        return new ErrorToken(pos);
    }

    protected void advance(int steps) {
        this.pos += steps;
    }
}
