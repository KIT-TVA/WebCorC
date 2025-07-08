package edu.kit.cbc.common.corc.parsing.program;

import edu.kit.cbc.common.corc.parsing.ParseException;
import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.lexer.Identifier;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.lexer.Separator;
import edu.kit.cbc.common.corc.parsing.parser.Parser;
import edu.kit.cbc.common.corc.parsing.parser.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.program.ast.AssignTree;
import edu.kit.cbc.common.corc.parsing.program.ast.BlockTree;
import edu.kit.cbc.common.corc.parsing.program.ast.LValue;
import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;
import java.util.ArrayList;
import java.util.List;

/**
 * This class holds the implementation of a parser for the following grammar.
     Condition
     c ::= e == e
         | e <= e
         | e >= c
         | e < e
         | e > e
         | c && c
         | c || c
         | c ==> c
         | c <==> c
         | predName(e...e)
         | \forall (t ident); c
         | \exists (t ident); c

     e ::= ident | const
         | (e)
         | e + e
         | e - e
         | e / e
         | e * e
         | e % e

     t ::= int | [..]
 */
public final class ProgramParser extends Parser {

    public ProgramParser(TokenSource tokenSource) {
        super(tokenSource);
    }

    public Tree parse() {
        List<StatementTree> statements = new ArrayList<>();

        while (tokenSource.hasMore()) {
            statements.add((StatementTree) parseStatement());
        }

        return new BlockTree(statements);
    }

    @Override
    protected Tree parseStatement() {
        if (tokenSource.hasMore() && tokenSource.peek() instanceof Identifier) {
            LValue lvalue = null;
            if (tokenSource.peek(1) instanceof Separator sep) {
                //METHOD CALL
                if (sep.type() == Separator.SeparatorType.PAREN_OPEN) {

                    Tree call = parseCall();
                    tokenSource.expectSeparator(Separator.SeparatorType.SEMICOLON);
                    return call;
                }
                //ARRAY ACCESS
                if (sep.type() == Separator.SeparatorType.SQR_PAREN_OPEN) {
                    lvalue = parseArrayAccess();
                }
            }

            if (lvalue == null) {
                lvalue = new IdentTree(tokenSource.expectIdentifier().identifier());
            }
            tokenSource.expectOperator(Operator.OperatorType.ASSIGN);

            Tree expr = parseExpression();

            tokenSource.expectSeparator(Separator.SeparatorType.SEMICOLON);

            return new AssignTree(lValue, expr);
        }

        throw new ParseException("Token " + tokenSource.peek()
            + " is not a program statement token. Allowed statements are assign statements and method calls!");
    }
}
