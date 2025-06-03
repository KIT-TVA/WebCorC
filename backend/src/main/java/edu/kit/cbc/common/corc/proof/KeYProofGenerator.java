package edu.kit.cbc.common.corc.proof;

import edu.kit.cbc.common.corc.cbcmodel.statements.Statement;
import java.util.List;
import java.util.function.Predicate;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariableKind;
import edu.kit.cbc.common.corc.cbcmodel.Renaming;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import edu.kit.cbc.common.corc.proof.KeYProof.KeYProofBuilder;

public final class KeYProofGenerator {

    private final List<JavaVariable> javaVariables;
    private final List<Condition> globalConditions;
    private final List<Renaming> renamings;

    public KeYProofGenerator(CbCFormula formula) {
        this.javaVariables = formula.getJavaVariables();
        this.globalConditions = formula.getGlobalConditions();
        this.renamings = formula.getRenamings();
    }

    public KeYProof generate(AbstractStatement statement) {

        KeYProofBuilder proofBuilder = KeYProof.builder();
        proofBuilder.programVariables(filterProgramVariables());

        proofBuilder.preCondition(statement.getPreCondition().rename(renamings));
        proofBuilder.postCondition(statement.getPostCondition().rename(renamings));

        List<Condition> renamedGlobalConditions = this.globalConditions.stream()
            .map(cond -> cond.rename(renamings)).toList();

        proofBuilder.globalConditions(renamedGlobalConditions);
        if (statement instanceof Statement st)
            proofBuilder.programStatement(st.getProgramStatement());

        return proofBuilder.build();
    }

    /**
     * Global variables as well as return variables are not considered program variables by KeY. Therefore, these are
     * filtered out here
     *
     * @return the list of variables without the variables of type GLOBAL and RETURN
     */
    private List<JavaVariable> filterProgramVariables() {
        //
        Predicate<? super JavaVariable> localFilter =
            var -> var.getKind() != JavaVariableKind.GLOBAL
                && var.getKind() != JavaVariableKind.RETURN;

        return this.javaVariables.stream().filter(localFilter).toList();
    }
}
