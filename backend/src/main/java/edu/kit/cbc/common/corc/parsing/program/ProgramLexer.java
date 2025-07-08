package edu.kit.cbc.common.corc.parsing.program;

import edu.kit.cbc.common.corc.parsing.ParseException;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.lexer.Token;
import java.util.Optional;

public final class ProgramLexer extends Lexer {

    private static final String PARSING_ERROR = "The token '%s' at position %d is not a valid token!";

    private ProgramLexer(String source) {
        super(source);
    }

    public static ProgramLexer forString(String source) {
        return new ProgramLexer(source);
    }

    @Override
    public Optional<Token> nextToken() {
        Optional<Token> optionalToken = super.nextToken();

        if (optionalToken.isEmpty()) {
            return optionalToken;
        }

        Token token = optionalToken.get();

        if (token instanceof Operator(Operator.OperatorType type, var ignored)
            && (type == Operator.OperatorType.FORALL || type == Operator.OperatorType.EXISTS)) {
            throw new ParseException(String.format(PARSING_ERROR, token, token.position()));
        }

        return Optional.of(token);
    }
}
