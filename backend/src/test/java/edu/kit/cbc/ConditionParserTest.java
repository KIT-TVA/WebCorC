package edu.kit.cbc;


import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.lexer.ConditionLexer;
import org.junit.jupiter.api.Test;

public class ConditionParserTest {

    @Test
    public void testLexer() {
        ConditionLexer lexer = ConditionLexer.forString("\\forall a + b > 0 <=> 10");
        TokenSource source = new TokenSource(lexer);

        while (source.hasMore()) {
            System.out.println(source.consume());
        }
    }
}
