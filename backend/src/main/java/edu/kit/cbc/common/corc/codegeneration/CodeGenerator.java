package edu.kit.cbc.common.corc.codegeneration;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariableKind;
import java.util.List;

public final class CodeGenerator {

    private static final String CLASS_PATTERN = """
        public final class SrcGen {
            %s
            public void method() {
                %s
            }
        }
        """;

    private CodeGenerator() {
    }

    public static String generate(CbCFormula formula) {
        return String.format(
            CLASS_PATTERN,
            generateLocalVariables(formula.getJavaVariables()),
            formula.getStatement().generate()
        );
    }

    private static String generateLocalVariables(List<JavaVariable> variables) {
        StringBuilder localVariables = new StringBuilder();
        for (JavaVariable variable : variables) {
            if (variable.getKind() == JavaVariableKind.LOCAL) {
                localVariables.append(variable.generate());
            }
        }

        return localVariables.toString();
    }
}
