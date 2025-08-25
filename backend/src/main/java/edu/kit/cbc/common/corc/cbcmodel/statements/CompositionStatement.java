package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.proof.ProofContext;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CompositionStatement extends AbstractStatement {

    private AbstractStatement firstStatement;
    private AbstractStatement secondStatement;
    private Condition intermediateCondition;

    @Override
    public boolean prove(ProofContext proofContext) {
        boolean firstProve = firstStatement.prove(proofContext);
        boolean secondProve = secondStatement.prove(proofContext);

        if (!firstProve) {
            System.err.println("[ERROR] The statement " + this.getName() + " could not be proven due to it's first "
                + "statement!");
        }

        if (!secondProve) {
            System.err.println("[ERROR] The statement " + this.getName() + " could not be proven due to it's second "
                + "statement!");
        }

        this.isProven = firstProve && secondProve;

        return firstProve && secondProve;
    }

    @Override
    public String generate() {
        return firstStatement.generate() + "\n" +  secondStatement.generate();
    }
}
