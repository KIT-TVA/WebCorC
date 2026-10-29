package edu.kit.cbc.common.corc.codegeneration;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariableKind;
import edu.kit.cbc.projects.files.controller.FilesController;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

public final class CodeGenerator {

    private static final String TAB_SPACES = "    ";
    private static final String JML_PATTERN = """
    /*@
      @ public normal_behavior
      @ requires %s;
      @ ensures %s;
      @*/""";
    private static final String CLASS_PATTERN = """
        public final class SrcGen {
        %s
        %s
        public void method() {
        %s
        }
        }
        """;

    private static final Logger LOGGER = Logger.getGlobal();

    private CodeGenerator() {
    }

    public static String generate(
            Optional<String> projectId,
            CbCFormula formula,
            FilesController filesController
    ) throws IOException {

        List<KeYPredicateParser.PredicateDefinition> predicateDefinitions =
                new ArrayList<>();

        if (projectId.isPresent()) {
            List<Path> includeFiles = filesController.retrieveFiles(
                    projectId.get(), ".key", "include"
            );

            LOGGER.info("Included KeY-Files: " + includeFiles);

            predicateDefinitions = KeYPredicateParser.parse(includeFiles);
        }

        String preCondition =
                formula.getStatement().getPreCondition().getRawCondition();

        String postCondition =
                formula.getStatement().getPostCondition().getRawCondition();

        if (!predicateDefinitions.isEmpty()) {
            KeYPredicateExpander expander =
                    new KeYPredicateExpander(predicateDefinitions);

            preCondition = expander.expand(preCondition);
            postCondition = expander.expand(postCondition);
        }

        return fixTabs(String.format(
                CLASS_PATTERN,
                generateLocalVariables(formula.getJavaVariables()),
                generateJML(preCondition, postCondition),
                formula.getStatement().generateCode()
        ));
    }

    private static String fixTabs(String toFix) {
        int currentTabDepth = 0;

        StringBuilder tabbed = new StringBuilder();

        for (String line : toFix.lines().toList()) {
            if (line.contains("}")) {
                currentTabDepth--;
            }

            tabbed.append(TAB_SPACES.repeat(currentTabDepth));
            tabbed.append(line);
            tabbed.append('\n');

            if (line.contains("{")) {
                currentTabDepth++;
            }
        }

        return tabbed.toString();
    }

    private static String generateLocalVariables(List<JavaVariable> variables) {
        StringBuilder localVariables = new StringBuilder();
        for (JavaVariable variable : variables) {
            if (variable.getKind() == JavaVariableKind.LOCAL) {
                localVariables.append(variable.generateCode());
                localVariables.append('\n');
            }
        }

        return localVariables.toString();
    }

    private static String generateJML(String requiresJML, String ensuresJML){
        return String.format(JML_PATTERN, requiresJML, ensuresJML);
    }
}
