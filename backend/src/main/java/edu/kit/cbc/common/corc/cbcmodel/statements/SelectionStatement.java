package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.parsing.condition.ConditionPrinter;
import edu.kit.cbc.common.corc.proof.KeYProof;
import edu.kit.cbc.common.corc.proof.KeYProofGenerator;
import edu.kit.cbc.common.corc.proof.ProofContext;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SelectionStatement extends AbstractStatement {
    private List<Condition> guards;
    private List<AbstractStatement> commands;
    private boolean isPreProven;

    @Override
    public boolean prove(ProofContext proofContext) {
        /*First Step: Prove that all commands are correct*/
        Map<AbstractStatement, Boolean> cmdProofs = commands.stream()
            .collect(Collectors.toMap(
                stmt -> stmt,
                stmt -> stmt.prove(proofContext)
            ));

        if (cmdProofs.containsValue(Boolean.FALSE)) {
            //Find statement that produces the problem
            Set<AbstractStatement> failedProofs = cmdProofs.entrySet().stream()
                .filter(entry -> !entry.getValue())
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

            proofContext.getLogger().accept(
                "ERROR: The proof of selection statement \"" + this.getName() + "\" failed, because of the following "
                    + "commands not being proven: ");
            failedProofs.forEach(stmt -> System.out.format("%t-%s%n", stmt.getName()));

            this.setProven(false);
            return false;
        }

        /*Second Step: Prove that the precondition implies one of the guards*/
        if (this.isPreProven()) {
            return true;
        }

        List<Condition> renamedGuards = this.getGuards().stream()
            .map(guard -> guard.rename(proofContext.getCbCFormula().getRenamings()))
            .toList();

        Condition joinedGuards = Condition.fromListToConditionOr(renamedGuards);

        KeYProofGenerator generator = new KeYProofGenerator(proofContext);
        KeYProof proof = generator.generateImplicationProof(
            this.getPreCondition().rename(proofContext.getCbCFormula().getRenamings()),
            joinedGuards,
            this
        );

        this.isPreProven = proof.execute();

        if (!this.isPreProven) {
            proofContext.getLogger().accept("ERROR: P => G | G | G could not be proven for statement \"" + this.getName() + "\"");
        }

        this.isProven = this.isPreProven;

        return this.isProven;
    }

    @Override
    public String generate() {
        StringBuilder ifBuilder = new StringBuilder();

        for (int i = 0; i < this.getGuards().size(); i++) {
            ifBuilder.append("if (");
            ifBuilder.append(ConditionPrinter.print(this.guards.get(i).getParsedCondition()));
            ifBuilder.append(") {\n");
            ifBuilder.append(this.commands.get(i).generate());
            ifBuilder.append("}\n");
        }

        return ifBuilder.toString();
    }
}
