package edu.kit.cbc;


import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.condition.ConditionParser;
import edu.kit.cbc.common.corc.parsing.condition.ConditionPrinter;
import edu.kit.cbc.common.corc.parsing.lexer.ConditionLexer;
import org.junit.jupiter.api.Test;

public class ConditionParserTest {

    @Test
    public void testLexer() {
        //\\forall (int a;) (a + 1 == 0)
        ConditionLexer lexer = ConditionLexer.forString("testPred(a[0],b-2) && 17");
        TokenSource source = new TokenSource(lexer);
        ConditionParser parser = new ConditionParser(source);
        System.out.println(ConditionPrinter.print(parser.parseCondition()));
    }
}
