package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.parsing.condition.ConditionPrinter;
import edu.kit.cbc.common.corc.proof.KeYProof;
import edu.kit.cbc.common.corc.proof.KeYProofGenerator;
import edu.kit.cbc.common.corc.proof.ProofContext;
import java.util.List;
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
            proofContext.getLogger().accept("ERROR: Proving the loop statement of statement \"" + this.getName() + "\" failed!");
            return false;
        }

        if (!isVariantProven) {
            KeYProof variantProof = proofGenerator.generateVariantProof(variant, invariant, guard, this);
            this.isVariantProven = variantProof.execute();

            if (!this.isVariantProven) {
                proofContext.getLogger().accept("ERROR: Proving that the variant of statement \"" + this.getName() + "\" is a variant failed!");
                return false;
            }
        }

        if (!this.isPreProven) {
            KeYProof preImpliesInvariant = proofGenerator.generateImplicationProof(
                    this.getPreCondition(),
                    this.invariant,
                    this
            );
            this.isPreProven = preImpliesInvariant.execute();

            if (!this.isPreProven) {
                proofContext.getLogger().accept("ERROR: The implication of Pre => Invariant failed for statement: "
                    + this.getName());
                return false;
            }
        }

        if (!this.isPostProven) {
            KeYProof postImpliesGuard = proofGenerator.generateImplicationProof(
                Condition.fromListToConditionAnd(List.of(this.invariant, Condition.not(this.guard))),
                this.getPostCondition(),
                this);
            this.isPostProven = postImpliesGuard.execute();

            if (!this.isPostProven) {
                proofContext.getLogger().accept("ERROR: The implication of (Invariant && !Guard) => Post failed for statement: "
                    + this.getName());
                return false;
            }
        }

        this.isProven = true;
        return true;
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
