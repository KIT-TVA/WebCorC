package edu.kit.cbc.common.corc.parsing.lexer;

import edu.kit.cbc.common.corc.parsing.ParseException;
import java.util.Optional;

public final class ConditionLexer extends Lexer {

    private ConditionLexer(String source) {
        super(source);
    }

    public static ConditionLexer forString(String source) {
        return new ConditionLexer(source);
    }

    @Override
    public Optional<Token> nextToken() {
        skipWhiteSpace();

        if (pos >= source.length()) {
            return Optional.empty();
        }

        int advanceSteps = 1;

        Token token = switch (peek()) {
            case '(' -> new Separator(Separator.SeparatorType.PAREN_OPEN);
            case ')' -> new Separator(Separator.SeparatorType.PAREN_CLOSE);
            case ';' ->  new Separator(Separator.SeparatorType.SEMICOLON);
            case ',' -> new Separator(Separator.SeparatorType.COMMA);
            case '+' -> new Operator(Operator.OperatorType.PLUS);
            case '-' -> new Operator(Operator.OperatorType.MINUS);
            case '*' -> new Operator(Operator.OperatorType.MUL);
            case '/' -> new Operator(Operator.OperatorType.DIV);
            case '%' -> new Operator(Operator.OperatorType.MOD);
            case '&' -> {
                advanceSteps = 2;
                yield lexDoubleOperator('&', new Operator(Operator.OperatorType.AND));
            }
            case '|' -> {
                advanceSteps = 2;
                yield lexDoubleOperator('|', new Operator(Operator.OperatorType.OR));
            }
            case '\\' -> {
                advanceSteps = "\\forall".length();
                yield switch (readIdentifierName()) {
                    case "\\forall" -> new Operator(Operator.OperatorType.FORALL);
                    case "\\exists" -> new Operator(Operator.OperatorType.EXISTS);
                    default -> throw new ParseException("The token '" + peek() + "' at position " + this.pos + " is not a valid token!");
                };
            }
            case '<' -> {
                if (hasMore(1) && peek(1) == '=') {
                    advanceSteps = 2;
                    if (hasMore(2) && peek(2) == '>') {
                        advanceSteps = 3;
                        yield new Operator(Operator.OperatorType.EQUIVALENT);
                    }
                    yield new Operator(Operator.OperatorType.LESS_THAN_OR_EQUAL);
                }
                yield new Operator(Operator.OperatorType.LESS_THAN);
            }
            case '>' -> {
                if (hasMore(1) && peek(1) == '=') {
                    advanceSteps = 2;
                    yield new Operator(Operator.OperatorType.GREATER_THAN_OR_EQUAL);
                }
                yield new Operator(Operator.OperatorType.GREATER_THAN);
            }
            case '!' -> {
                if (hasMore(1) && peek(1) == '=') {
                    advanceSteps = 2;
                    yield new Operator(Operator.OperatorType.NOT_EQUAL);
                }
                yield new Operator(Operator.OperatorType.NOT);
            }
            case '=' -> {
                if (hasMore(1) && peek(1) == '=') {
                    advanceSteps = 2;
                    if (hasMore(2) && peek(2) == '>') {
                        advanceSteps = 3;
                        yield new Operator(Operator.OperatorType.IMPLICATION);
                    }
                    yield new Operator(Operator.OperatorType.EQUAL);
                }
                throw new ParseException("The token '=' at position " + this.pos + " is not a valid token!");
            }
            default -> {
                advanceSteps = 0;
                if (isNumeric(peek())) {
                    yield lexIntLiteral();
                }

                if (isIdentifierChar(peek())) {
                    yield lexIdentifier();
                }

                advance(1);
                throw new ParseException("The token '" + peek() + "' at position " + this.pos + " is not a valid token!");
            }
        };

        advance(advanceSteps);

        return Optional.of(token);
    }

}
