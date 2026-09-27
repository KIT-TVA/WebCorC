package edu.kit.ifbc.common.ifbcmodel.statements;

import edu.kit.ifbc.common.ifbcmodel.LatticeResultContext;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.VariableState;
import io.micronaut.serde.annotation.Serdeable;


@Serdeable
public class SkipStatement extends AbstractIFbCStatement {
    @Override
    public VariableState calculatePostVariableState(
        Lattice lattice, 
        Lattice.Level level,
        VariableState preVariableState,
        LatticeResultContext context
    ) { 
        context.setInfo(preVariableState, level);
        return preVariableState;
    }
}
