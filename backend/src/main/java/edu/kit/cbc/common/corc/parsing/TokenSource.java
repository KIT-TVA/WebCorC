package edu.kit.cbc.common.corc.parsing;

import edu.kit.cbc.common.corc.parsing.lexer.Identifier;
import edu.kit.cbc.common.corc.parsing.lexer.Keyword;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.lexer.Separator;
import edu.kit.cbc.common.corc.parsing.lexer.Token;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

public class TokenSource {
    private final List<Token> tokens;
    private final String source;
    private int idx;

    public TokenSource(Lexer lexer) {
        this.source = lexer.getSource();
        this.tokens = Stream.generate(lexer::nextToken)
            .takeWhile(Optional::isPresent)
            .map(Optional::orElseThrow)
            .toList();
    }

    public String getSource() { return this.source; }

    public Token peek() {
        expectHasMore(0);
        return this.tokens.get(this.idx);
    }

    public Token peek(int offset) {
        expectHasMore(offset);
        return this.tokens.get(this.idx + offset);
    }

    public Keyword expectKeyword(Keyword.KeywordType type) {
        Token token = peek();
        if (!(token instanceof Keyword kw) || kw.type() != type) {
            String expected = "keyword '" + type + "'";
            String found = token.toString();
            throw new ParseException(
                "expected " + expected + " but got " + found,
                token.position(), this.source, expected, found);
        }
        this.idx++;
        return kw;
    }

    public Separator expectSeparator(Separator.SeparatorType type) {
        Token token = peek();
        if (!(token instanceof Separator sep) || sep.type() != type) {
            String expected = "separator '" + type + "'";
            String found = token.toString();
            throw new ParseException(
                "expected " + expected + " but got " + found,
                token.position(), this.source, expected, found);
        }
        this.idx++;
        return sep;
    }

    public Operator expectOperator(Operator.OperatorType type) {
        Token token = peek();
        if (!(token instanceof Operator op) || op.type() != type) {
            String expected = "operator '" + type + "'";
            String found = token.toString();
            throw new ParseException(
                "expected " + expected + " but got " + found,
                token.position(), this.source, expected, found);
        }
        this.idx++;
        return op;
    }

    public Identifier expectIdentifier() {
        Token token = peek();
        if (!(token instanceof Identifier ident)) {
            String found = token.toString();
            throw new ParseException(
                "expected identifier but got " + found,
                token.position(), this.source, "identifier", found);
        }
        this.idx++;
        return ident;
    }

    public Token consume() {
        Token token = peek();
        this.idx++;
        return token;
    }

    public boolean hasMore() {
        return this.idx < this.tokens.size();
    }

    public boolean hasMore(int amount) {
        return this.idx + amount < this.tokens.size();
    }

    private void expectHasMore(int amount) {
        if (this.idx + amount >= this.tokens.size()) {
            throw new ParseException("reached end of tokens", -1, this.source, "more tokens", "end of input");
        }
    }
}
