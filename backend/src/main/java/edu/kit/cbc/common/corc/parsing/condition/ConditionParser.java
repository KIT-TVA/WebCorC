package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.parser.Parser;

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
public final class ConditionParser extends Parser {

    public ConditionParser(TokenSource tokenSource) {
        super(tokenSource);
    }

}
