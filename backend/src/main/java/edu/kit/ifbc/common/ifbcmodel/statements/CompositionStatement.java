package edu.kit.ifbc.common.ifbcmodel.statements;

import java.util.logging.Logger;

import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import edu.kit.ifbc.common.ifbcmodel.parsing.parser.VariableParsingException;
import io.micronaut.serde.annotation.Serdeable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Serdeable
public class CompositionStatement extends AbstractIFbCStatement {
    private final static Logger LOGGER = Logger.getGlobal();

    private AbstractIFbCStatement firstStatement;
    private AbstractIFbCStatement secondStatement;

    @Override
    public VariableState calculatePostVariableState(
        Lattice lattice, 
        Lattice.Level level,
        VariableState preVariableState,
        LatticeResultContext context
    ) throws VariableParsingException {
        LOGGER.fine("Condition: \t" + this.getPreCondition().getParsedCondition());
        context.handleChild(firstStatement.getId());
        VariableState postVariableStateS1 = firstStatement.calculatePostVariableState(lattice, level, preVariableState, context);
        context.finishChild();
        context.handleChild(secondStatement.getId());
        VariableState postVariableState = secondStatement.calculatePostVariableState(lattice, level, postVariableStateS1, context);
        context.finishChild();
        context.setInfo(postVariableState, level);
        return postVariableState;
    }
}
