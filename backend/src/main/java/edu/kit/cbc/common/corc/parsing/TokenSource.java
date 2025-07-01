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
    private int idx;

    public TokenSource(Lexer lexer) {
        this.tokens = Stream.generate(lexer::nextToken)
            .takeWhile(Optional::isPresent)
            .map(Optional::orElseThrow)
            .toList();
    }

    public Token peek() {
        expectHasMore();
        return this.tokens.get(this.idx);
    }

    public Keyword expectKeyword(Keyword.KeywordType type) {
        Token token = peek();
        if (!(token instanceof Keyword kw) || kw.type() != type) {
            throw new ParseException("expected keyword '" + type + "' but got " + token);
        }
        this.idx++;
        return kw;
    }

    public Separator expectSeparator(Separator.SeparatorType type) {
        Token token = peek();
        if (!(token instanceof Separator sep) || sep.type() != type) {
            throw new ParseException("expected separator '" + type + "' but got " + token);
        }
        this.idx++;
        return sep;
    }

    public Operator expectOperator(Operator.OperatorType type) {
        Token token = peek();
        if (!(token instanceof Operator op) || op.type() != type) {
            throw new ParseException("expected operator '" + type + "' but got " + token);
        }
        this.idx++;
        return op;
    }
    public Identifier expectIdentifier() {
        Token token = peek();
        if (!(token instanceof Identifier ident)) {
            throw new ParseException("expected identifier but got " + token);
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

    private void expectHasMore() {
        if (this.idx >= this.tokens.size()) {
            throw new ParseException("reached end of condition");
        }
    }
}
