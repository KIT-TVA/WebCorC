package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.proof.KeYProof;
import edu.kit.cbc.common.corc.proof.KeYProofGenerator;
import edu.kit.cbc.common.corc.proof.ProofContext;

public class SkipStatement extends AbstractStatement {
    @Override
    public boolean prove(ProofContext proofContext) {

        KeYProofGenerator proofGenerator = new KeYProofGenerator(proofContext);

        KeYProof proof = proofGenerator.generateImplicationProof(this.getPreCondition(),
            this.getPostCondition(), this);

        boolean proven = proof.execute();

        this.isProven = proven;

        if (!proven) {
            proofContext.getLogger().accept("ERROR: The implication of Pre => Post failed for skip statement: "
                + this.getName());
        }

        return proven;
    }

    @Override
    public String generateCode() {
        return "";
    }

    @Override
    public String generateCodeForProof() {
        return "";
    }
}
