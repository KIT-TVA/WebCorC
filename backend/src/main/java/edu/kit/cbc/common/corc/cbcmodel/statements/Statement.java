package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.proof.KeYProof;
import edu.kit.cbc.common.corc.proof.KeYProofGenerator;
import edu.kit.cbc.common.corc.proof.ProofContext;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Statement extends AbstractStatement {

    private String programStatement;

    @Override
    public boolean prove(ProofContext proofContext) {
        KeYProofGenerator proofGenerator = new KeYProofGenerator(proofContext);
        KeYProof proof = proofGenerator.generateBasicProof(this);

        this.isProven = proof.execute();

        return this.isProven();
    }
}
