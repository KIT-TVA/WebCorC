package edu.kit.cbc.common.corc.codegen;

import de.tu_bs.cs.isf.cbc.cbcclass.Field;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.GlobalConditions;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariable;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariables;
import de.tu_bs.cs.isf.cbc.cbcmodel.Renaming;
import de.tu_bs.cs.isf.cbc.cbcmodel.VariableKind;
import edu.kit.cbc.common.CbCFormulaContainer;
import java.util.LinkedList;

public class CodeGenerator {
    public static final CodeGenerator instance = new CodeGenerator();

    private CodeGenerator() {

    }

    public String generateCodeFor(CbCFormulaContainer container) {
        JavaVariables vars = container.javaVariables();
        GlobalConditions globalConditions = container.globalConditions();
        Renaming renaming = container.renaming();
        CbCFormula formula = container.cbcFormula();

        String signatureString = formula.getMethodObj() != null ? formula.getMethodObj().getSignature() :
                ("public void " + formula.getName().toLowerCase() + " ()");

        JavaVariable returnVariable = null;
        int counter = 0;
        LinkedList<String> localVariables = new LinkedList<String>();
        for (int i = 0; i < vars.getVariables().size(); i++) {
            JavaVariable currentVariable = vars.getVariables().get(i);
            if (currentVariable.getKind() == VariableKind.RETURN) {
                counter++;
                returnVariable = currentVariable;
            } else if (currentVariable.getKind() == VariableKind.LOCAL) {
                localVariables.add(currentVariable.getName().replace("non-null", ""));
            }
        }
        String globalVariables = "";
        for (Field field : vars.getFields()) {
            globalVariables += ("\t" + field.getVisibility().getName().toLowerCase() + " /*@spec_public@*/ "
                    + field.getType() + " " + field.getName().replace("non-null ", "") + ";\n");
        }

        String code = ConstructCodeBlock.constructCodeBlockForExport(formula,
                globalConditions, renaming, localVariables, returnVariable, signatureString, new String[0]);
        return code;
    }
}
