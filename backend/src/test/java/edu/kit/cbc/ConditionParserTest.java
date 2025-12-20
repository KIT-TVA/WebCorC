package edu.kit.cbc;


import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.condition.ConditionParser;
import edu.kit.cbc.common.corc.parsing.condition.ConditionPrinter;
import edu.kit.cbc.common.corc.parsing.condition.ConditionLexer;
import org.junit.jupiter.api.Test;

public class ConditionParserTest {

    @Test
    public void test() {
        //\\forall (int a;) (a + 1 == 0)
        ConditionLexer lexer = ConditionLexer.forString("testPred(A[0], A.length) && 17");
        TokenSource source = new TokenSource(lexer);
        ConditionParser parser = new ConditionParser(source);
        System.out.println(ConditionPrinter.print(parser.parse()));
    }
}
