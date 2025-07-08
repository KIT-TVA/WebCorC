package edu.kit.cbc.common.corc.parsing.lexer;

import edu.kit.cbc.common.corc.parsing.ParseException;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

public abstract class Lexer {

    private static final List<Character> WHITESPACE_TOKEN = List.of(' ', '\t', '\r', '\n');

    protected final String source;
    protected int pos;

    protected Lexer(String source) {
        this.source = source;
    }

    public Optional<Token> nextToken() {

        skipWhiteSpace();

        if (pos >= source.length()) {
            return Optional.empty();
        }

        int advanceSteps = 1;

        Token token = switch (peek()) {
            case '(' -> new Separator(Separator.SeparatorType.PAREN_OPEN, pos);
            case ')' -> new Separator(Separator.SeparatorType.PAREN_CLOSE, pos);
            case '[' -> new Separator(Separator.SeparatorType.SQR_PAREN_OPEN, pos);
            case ']' -> new Separator(Separator.SeparatorType.SQR_PAREN_CLOSE, pos);
            case ';' -> new Separator(Separator.SeparatorType.SEMICOLON, pos);
            case ',' -> new Separator(Separator.SeparatorType.COMMA, pos);
            case '+' -> new Operator(Operator.OperatorType.PLUS, pos);
            case '-' -> new Operator(Operator.OperatorType.MINUS, pos);
            case '*' -> new Operator(Operator.OperatorType.MUL, pos);
            case '/' -> new Operator(Operator.OperatorType.DIV, pos);
            case '%' -> new Operator(Operator.OperatorType.MOD, pos);
            case '~' -> new Operator(Operator.OperatorType.ARITH_NOT, pos);
            case '^' -> new Operator(Operator.OperatorType.ARITH_XOR, pos);
            case '&' -> {
                if (hasMore(1) && peek(1) == '&') {
                    advanceSteps = 2;
                    yield lexDoubleOperator('&', new Operator(Operator.OperatorType.LOGICAL_AND, pos));
                }

                yield new Operator(Operator.OperatorType.ARITH_AND, pos);
            }
            case '|' -> {
                if (hasMore(1) && peek(1) == '|') {
                    advanceSteps = 2;
                    yield lexDoubleOperator('|', new Operator(Operator.OperatorType.LOGICAL_OR, pos));
                }
                yield new Operator(Operator.OperatorType.ARITH_OR, pos);
            }
            case '\\' -> {
                advanceSteps = "\\forall".length();
                yield
                    switch (readIdentifierName()) {
                        case "\\forall" -> new Operator(Operator.OperatorType.FORALL, pos);
                        case "\\exists" -> new Operator(Operator.OperatorType.EXISTS, pos);
                        default -> throw new ParseException(
                            "The token '" + peek() + "' at position " + this.pos + " is not a valid token!");
                    };
            }
            case '<' -> {
                if (hasMore(1) && peek(1) == '=') {
                    advanceSteps = 2;
                    if (hasMore(2) && peek(2) == '>') {
                        advanceSteps = 3;
                        yield new Operator(Operator.OperatorType.EQUIVALENT, pos);
                    }
                    yield new Operator(Operator.OperatorType.LESS_THAN_OR_EQUAL, pos);
                }
                yield new Operator(Operator.OperatorType.LESS_THAN, pos);
            }
            case '>' -> {
                if (hasMore(1) && peek(1) == '=') {
                    advanceSteps = 2;
                    yield new Operator(Operator.OperatorType.GREATER_THAN_OR_EQUAL, pos);
                }
                yield new Operator(Operator.OperatorType.GREATER_THAN, pos);
            }
            case '!' -> {
                if (hasMore(1) && peek(1) == '=') {
                    advanceSteps = 2;
                    yield new Operator(Operator.OperatorType.NOT_EQUAL, pos);
                }
                yield new Operator(Operator.OperatorType.NOT, pos);
            }
            case '=' -> {
                if (hasMore(1) && peek(1) == '=') {
                    advanceSteps = 2;
                    if (hasMore(2) && peek(2) == '>') {
                        advanceSteps = 3;
                        yield new Operator(Operator.OperatorType.IMPLICATION, pos);
                    }
                    yield new Operator(Operator.OperatorType.EQUAL, pos);
                }
                yield new Operator(Operator.OperatorType.ASSIGN, pos);
            }
            default -> {
                advanceSteps = 0;
                if (isNumeric(peek())) {
                    yield lexIntLiteral();
                }

                if (isIdentifierChar(peek())) {
                    yield lexIdentifier();
                }

                throw new ParseException(
                    "The token '" + peek() + "' at position " + this.pos + " is not a valid token!");
            }
        };

        advance(advanceSteps);

        return Optional.of(token);
    }

    protected void skipWhiteSpace() {
        while (hasMore(0)) {
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
            return new Keyword(matchingKeyWord.get(), pos);
        }

        return new Identifier(name, pos);
    }

    protected Token lexIntLiteral() {
        int offset = 1;

        while (hasMore(offset) && isNumeric(peek(offset))) {
            offset++;
        }
        Token result = new NumberLiteral(this.source.substring(this.pos, this.pos + offset), pos);

        advance(offset);

        return result;
    }

    protected boolean isIdentifierChar(char c)  {
        return '0' <= c && c <= '9'
            || 'A' <= c && c <= 'Z'
            || 'a' <= c && c <= 'z'
            || c == '_';
    }

    protected boolean isNumeric(char c) {
        return '0' <= c && c <= '9';
    }

    protected Token lexDoubleOperator(char c, Token token) {
        if (peek() == c) {
            if (hasMore(1) && peek(1) == c) {
                return token;
            }
        }

        throw new ParseException("Expected double operator " + token + token);
    }

    protected void advance(int steps) {
        this.pos += steps;
    }
}
