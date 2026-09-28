package edu.kit.ifbc.common.ifbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsingException;
import io.micronaut.serde.annotation.Serdeable;

import java.util.logging.Logger;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Serdeable
public class SmallRepetitionStatement extends AbstractIFbCStatement {
    private final static Logger LOGGER = Logger.getGlobal();

    private AbstractIFbCStatement loopStatement;
    private Condition guard;

    @Override
    public VariableState calculatePostVariableState(
        Lattice lattice, 
        Lattice.Level level,
        VariableState preVariableState,
        LatticeResultContext context
    ) throws VariableParsingException {
        String[] usedVariables = getRelevantVariablesInCondition(guard, preVariableState);
        Lattice.Level lub = lattice.leastUpperBound(preVariableState.levelOf(lattice.getMinimalLevel(), usedVariables));
        Lattice.Level contextLevel = lattice.leastUpperBound(lub, level);
        
        LOGGER.fine("Condition: \t" + this.getPreCondition().getParsedCondition());
        VariableState postVariableState = loopStatement.calculatePostVariableState(lattice, contextLevel, preVariableState, context);
        context.setInfo(postVariableState, contextLevel);
        return postVariableState;
    }
}
