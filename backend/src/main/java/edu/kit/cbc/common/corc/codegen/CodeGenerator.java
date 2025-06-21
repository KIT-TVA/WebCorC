package edu.kit.cbc.common.corc.codegen;

import edu.kit.cbc.common.CbCFormulaContainer;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariableKind;
import edu.kit.cbc.common.corc.cbcmodel.Renaming;
import java.util.ArrayList;
import java.util.List;

public class CodeGenerator {
    public static final CodeGenerator instance = new CodeGenerator();

    private CodeGenerator() {

    }

    public String generateCodeFor(CbCFormulaContainer container) {
        List<JavaVariable> vars = container.getJavaVariables();
        List<Condition> globalConditions = container.getGlobalConditions();
        List<Renaming> renaming = container.getRenamings();
        CbCFormula formula = container.getCbcFormula();

        String signatureString = String.format("public void %s()", formula.getName().toLowerCase());
        JavaVariable returnVariable = null;
        int counter = 0;
        List<String> localVariables = new ArrayList<>();
        for (int i = 0; i < vars.size(); i++) {
            JavaVariable currentVariable = vars.get(i);
            if (currentVariable.getKind() == JavaVariableKind.RETURN) {
                counter++;
                returnVariable = currentVariable;
            } else if (currentVariable.getKind() == JavaVariableKind.LOCAL) {
                localVariables.add(currentVariable.getName().replace("non-null", ""));
            }
        }
        String globalVariables = "";
        String code = ConstructCodeBlock.constructCodeBlockForExport(formula,
                globalConditions, renaming, localVariables, returnVariable, signatureString,
                new String[0]);
        return code;
    }
}
