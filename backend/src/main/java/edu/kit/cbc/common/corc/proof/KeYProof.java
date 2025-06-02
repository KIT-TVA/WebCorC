package edu.kit.cbc.common.corc.proof;

import java.io.File;
import java.util.List;
import java.util.stream.Collectors;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import lombok.Builder;

@Builder
public class KeYProof {

    private static final String KEY_HEADER = """
            \\javaSource "%s";
            \\include "helper.key";
            \\programVariables {
                %s
            Heap heapAtPre;}";
            """;
    private static final String KEY_BODY = """
            \\problem{(
                %s
                %s
                & wellFormed(heap)) -> {heapPre := heap}
            \\<{%s}\\>
            (%s)
            }
            """;
    private static final String PROGRAM_VARIABLE_SEPARATOR = "; ";
    private static final String GLOBAL_CONDITIONS_SEPARATOR = " & ";

    private final File file;
    private final Condition preCondition;
    private final Condition postCondition;
    private final String programStatement;
    private final List<JavaVariable> programVariables;
    private final List<Condition> globalConditions;

    @Override
    public String toString() {
      return this.printKeYHeader() +
        printKeYBody();
    }

    private String printKeYHeader() {
        return String.format(KEY_HEADER, file.getAbsoluteFile(), printProgramVariables());
    }

    private String printKeYBody() {
        return String.format(KEY_BODY, preCondition, printGlobalConditions(), programStatement, postCondition);
    }

    private String printProgramVariables() {
        return this.programVariables.stream()
                .map(JavaVariable::toString)
                .collect(Collectors.joining(PROGRAM_VARIABLE_SEPARATOR));
    }

    private String printGlobalConditions() {
        return this.globalConditions.stream()
                .map(Condition::toString)
                .collect(Collectors.joining(GLOBAL_CONDITIONS_SEPARATOR));
    }
}
