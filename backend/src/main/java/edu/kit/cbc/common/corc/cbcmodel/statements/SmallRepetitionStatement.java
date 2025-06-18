package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.proof.ProofContext;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmallRepetitionStatement extends AbstractStatement {

    private AbstractStatement loopStatement;
    private Condition variant;
    private Condition invariant;
    private Condition guard;
    private boolean isVariantProven;
    private boolean isPreProven;
    private boolean isPostProven;

    @Override
    public boolean prove(ProofContext proofContext) {
        return false;
    }
}
