package edu.kit.ifbc.common.ifbcmodel.statements;

import java.util.Arrays;
import java.util.logging.Logger;

import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import edu.kit.cbc.common.corc.parsing.program.ProgramLexer;
import edu.kit.cbc.common.corc.parsing.program.ProgramParser;
import edu.kit.cbc.common.corc.parsing.program.ast.BlockTree;
import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;
import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsing;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsingException;
import io.micronaut.serde.annotation.Serdeable;
import lombok.Data;

@Data
@Serdeable
public class Statement extends AbstractIFbCStatement {
    private final static Logger LOGGER = Logger.getGlobal();

    private String variable;
    private String programStatement;

    public String[] getAssignmentLHSVariables(VariableState variables, StatementTree tree) throws VariableParsingException {
        return VariableParsing.getAssignmentLHSVariables(tree, variables.getVariableSet());
    }

    @Override
    public VariableState calculatePostVariableState(
        Lattice lattice, 
        Lattice.Level level,
        VariableState preVariableState,
        LatticeResultContext context
    ) throws VariableParsingException {
        LOGGER.fine("Condition: \t" + this.getPreCondition().getParsedCondition());
        LOGGER.fine(programStatement);

        // parse the statement to obtain the statement trees
        Lexer lexer = ProgramLexer.forString(this.programStatement);
        TokenSource source = new TokenSource(lexer);
        ProgramParser parser = new ProgramParser(source);
        BlockTree programm = ((BlockTree) parser.parse());
        if (programm.statements().size() == 0) {
            return preVariableState;
        }
        VariableState postVariableState = new VariableState(preVariableState);

        // handle each statement tree individually.
        // determine gradually each lub of the rhs and update the lhs accordingly.
        for (StatementTree tree : programm.statements()) {
            LOGGER.fine("Statement-Tree: \t" + tree);
            
            String[] usedVariables = getRelevantVariablesInStatement(programStatement, preVariableState);
            if (usedVariables == null) {
                continue;
            }
            String[] assignedVariables = getAssignmentLHSVariables(preVariableState, tree);
            if (assignedVariables == null) {
                return preVariableState;
            }
            this.variable = assignedVariables[0];
            // Logger.getGlobal().warning("used variables: \t" + String.join(",", usedVariables) + " \t variable: " + this.variable);
            Logger.getGlobal().warning("used confstates: \t" + Arrays.toString(preVariableState.levelOf(lattice.getMinimalLevel(), usedVariables)));
            Lattice.Level lub = lattice.leastUpperBound(preVariableState.levelOf(lattice.getMinimalLevel(), usedVariables));
            
            LOGGER.fine("lub of preVariableStates: " + lub.name());
            lub = lattice.leastUpperBound(lub, preVariableState.levelOf(variable, lattice.getMinimalLevel()), level);

            LOGGER.fine("level: " + level.name());
            LOGGER.fine("lub afterwards: " + lub.name());
            postVariableState = postVariableState.with(variable, lub);
        }

        context.setInfo(postVariableState, level);
        return postVariableState;
    }
}
