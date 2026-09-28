package edu.kit.ifbc.common.ifbcmodel.statements;

import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;

import java.util.Arrays;
import java.util.logging.Logger;

import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import edu.kit.cbc.common.corc.parsing.program.ProgramLexer;
import edu.kit.cbc.common.corc.parsing.program.ProgramParser;
import edu.kit.cbc.common.corc.parsing.program.ast.BlockTree;
import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsingException;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class ReturnStatement extends AbstractIFbCStatement {

    private final static String RET_VARIABLE = "ret";
    private final static Logger LOGGER = Logger.getGlobal();

    private String returnStatement;

    @Override
    public VariableState calculatePostVariableState(
        Lattice lattice, 
        Lattice.Level level,
        VariableState preVariableState,
        LatticeResultContext context
    ) throws VariableParsingException {
        LOGGER.fine("Condition: \t" + this.getPreCondition().getParsedCondition());
        LOGGER.fine(returnStatement);
        Lexer lexer = ProgramLexer.forString(this.returnStatement);
        TokenSource source = new TokenSource(lexer);
        ProgramParser parser = new ProgramParser(source);
        BlockTree programm = ((BlockTree) parser.parse());
        if (programm.statements().size() == 0) {
            return preVariableState;
        }
        VariableState postVariableState = new VariableState(preVariableState);
        StatementTree tree = programm.statements().getFirst();
        LOGGER.fine("Statement-Tree: \t" + tree);
        
        String[] usedVariables = getRelevantVariablesInStatement(this.returnStatement, preVariableState);
        if (usedVariables == null) {
            usedVariables = new String[0];
        }
        LOGGER.fine("used prevariable states: \t" + Arrays.toString(preVariableState.levelOf(lattice.getMinimalLevel(), usedVariables)));
        Lattice.Level lub = lattice.leastUpperBound(preVariableState.levelOf(lattice.getMinimalLevel(), usedVariables));
        LOGGER.fine("lub of preVariableStates: " + lub.name());
        lub = lattice.leastUpperBound(lub, preVariableState.levelOf(RET_VARIABLE, lattice.getMinimalLevel()), level);

        LOGGER.fine("level: " + level.name());
        LOGGER.fine("lub afterwards: " + lub.name());
        postVariableState = postVariableState.with(RET_VARIABLE, lub);

        context.setInfo(postVariableState, level);
        return postVariableState;
    }
}
