package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.ParseException;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.lexer.Separator;
import edu.kit.cbc.common.corc.parsing.lexer.Token;
import java.util.Optional;

public final class ConditionLexer extends Lexer {

    private static final String PARSING_ERROR = "The token '%s' at position %d is not a valid token!";

    private ConditionLexer(String source) {
        super(source);
    }

    public static ConditionLexer forString(String source) {
        return new ConditionLexer(source);
    }

    @Override
    public Optional<Token> nextToken() {
        Optional<Token> optionalToken = super.nextToken();

        if (optionalToken.isEmpty()) {
            return optionalToken;
        }

        Token token = optionalToken.get();

        if (token instanceof Separator(Separator.SeparatorType type, var ignored)
            && type == Separator.SeparatorType.SEMICOLON) {
            throw new ParseException(String.format(PARSING_ERROR, token, token.position()));
        }

        if (token instanceof Operator(Operator.OperatorType type, var ignored)
            && type == Operator.OperatorType.ASSIGN) {
            throw new ParseException(String.format(PARSING_ERROR, token, token.position()));
        }

        return Optional.of(token);
    }

}
