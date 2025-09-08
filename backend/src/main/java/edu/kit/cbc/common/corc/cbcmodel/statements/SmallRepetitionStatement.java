package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.parsing.condition.ConditionPrinter;
import edu.kit.cbc.common.corc.proof.KeYProof;
import edu.kit.cbc.common.corc.proof.KeYProofGenerator;
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
        KeYProofGenerator proofGenerator = new KeYProofGenerator(proofContext);
        /*First Step: Prove that loop statement is correct*/
        if (!loopStatement.prove(proofContext)) {
            System.out.println("[ERROR] Proving the loop statement of statement \"" + this.getName() + "\" failed!");
            return false;
        }

        if (!isVariantProven) {

            KeYProof variantProof = proofGenerator.generateVariantProof(variant, invariant, guard, this);
        }

        return false;
    }

    @Override
    public String generate() {
        final String whilePattern = """
            while (%s) {
                %s
            }
            
            """;

        return String.format(whilePattern, ConditionPrinter.print(guard.getParsedCondition()), loopStatement.generate());
    }
}
