package edu.kit.cbc.common.corc.parsing.program;

import edu.kit.cbc.common.corc.parsing.ParseException;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.lexer.Token;
import java.util.List;
import java.util.Optional;

public final class ProgramLexer extends Lexer {

    private static final String PARSING_ERROR = "The token '%s' at position %d is not a valid token!";
    private static final List<Operator.OperatorType> FORBIDDEN_OPERATORS = List.of(
        Operator.OperatorType.FORALL,
        Operator.OperatorType.EXISTS,
        Operator.OperatorType.OLD
    );

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
            && (FORBIDDEN_OPERATORS.contains(type))) {
            throw new ParseException(String.format(PARSING_ERROR, token, token.position()));
        }

        return Optional.of(token);
    }
}
