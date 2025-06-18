package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.proof.ProofContext;

public class ReturnStatement extends AbstractStatement {

    private String returnStatement;

    @Override
    public boolean prove(ProofContext proofContext) {
        return false;
    }
}
