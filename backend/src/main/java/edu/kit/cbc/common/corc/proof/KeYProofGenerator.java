package edu.kit.cbc.common.corc.proof;

import edu.kit.cbc.common.corc.cbcmodel.statements.Statement;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariableKind;
import edu.kit.cbc.common.corc.cbcmodel.Renaming;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import edu.kit.cbc.common.corc.proof.KeYProof.KeYProofBuilder;

public final class KeYProofGenerator {

    private final ProofContext proofContext;

    public KeYProofGenerator(ProofContext proofContext) {
        this.proofContext = proofContext;
    }

    /**
     * Generates a KeY proof for a specific statement. From my current understanding
     * all that we ever prove are normal statements ({P} S {Q}) or sometimes variants/invariants.
     * Therefore, the parameter is restricted to {@link Statement}.
     *
     * @param statement the statement that we want the KeYProof to generate for
     * @return the KeY proof generated from the statement
     */
    public KeYProof generate(Statement statement) {
        CbCFormula formula = this.proofContext.getCbCFormula();
        List<Renaming> renamings = formula.getRenamings();
        List<Condition> globalConditions = formula.getGlobalConditions();
        List<JavaVariable> javaVariables = formula.getJavaVariables();


        KeYProofBuilder proofBuilder = KeYProof.builder();
        proofBuilder.programVariables(filterProgramVariables(javaVariables));

        proofBuilder.javaSrcFiles(this.proofContext.getJavaSrcFiles());
        proofBuilder.includedFiles(this.proofContext.getIncludeFiles());
        proofBuilder.existingProofFiles(this.proofContext.getExistingProofFiles());
        proofBuilder.proofFolder(this.proofContext.getProofFolder());

        proofBuilder.statementName(statement.getName());

        proofBuilder.preCondition(statement.getPreCondition().rename(renamings));
        proofBuilder.postCondition(statement.getPostCondition().rename(renamings));

        List<Condition> renamedGlobalConditions = globalConditions.stream()
            .map(cond -> cond.rename(renamings)).toList();

        proofBuilder.globalConditions(renamedGlobalConditions);
        proofBuilder.programStatement(statement.getProgramStatement());

        return proofBuilder.build();
    }

    /**
     * Global variables as well as return variables are not considered program variables by KeY. Therefore, these are
     * filtered out here
     *
     * @return the list of variables without the variables of type GLOBAL and RETURN
     */
    private List<JavaVariable> filterProgramVariables(List<JavaVariable> javaVariables) {
        //
        Predicate<? super JavaVariable> localFilter =
            var -> var.getKind() != JavaVariableKind.GLOBAL
                && var.getKind() != JavaVariableKind.RETURN;

        return javaVariables.stream().filter(localFilter).toList();
    }
}
