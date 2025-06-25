package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.proof.ProofContext;

public class SkipStatement extends AbstractStatement {
    @Override
    public boolean prove(ProofContext proofContext) {
        return true;
    }
}
