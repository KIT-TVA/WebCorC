package edu.kit.cbc;


import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.condition.ConditionParser;
import edu.kit.cbc.common.corc.parsing.condition.ConditionPrinter;
import edu.kit.cbc.common.corc.parsing.lexer.ConditionLexer;
import org.junit.jupiter.api.Test;

public class ConditionParserTest {

    @Test
    public void testLexer() {
        //
        ConditionLexer lexer = ConditionLexer.forString("\\forall (int a;) (a + 1 == 0)");
        TokenSource source = new TokenSource(lexer);
        ConditionParser parser = new ConditionParser(source);
        System.out.println(ConditionPrinter.print(parser.parseCondition()));
    }
}
