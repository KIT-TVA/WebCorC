package edu.kit.cbc;

import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.program.ProgramLexer;
import edu.kit.cbc.common.corc.parsing.program.ProgramParser;
import edu.kit.cbc.common.corc.parsing.program.ProgramPrinter;
import org.junit.jupiter.api.Test;

public class ProgramParserTest {

    @Test
    public void test() {
        ProgramLexer lexer = ProgramLexer.forString("hello(); a=a+b*(c);");
        TokenSource source = new TokenSource(lexer);
        ProgramParser parser = new ProgramParser(source);
        System.out.println(ProgramPrinter.print(parser.parse()));
    }
}
