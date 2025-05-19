package edu.kit.cbc.common.corc;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariableKind;
import edu.kit.cbc.common.corc.codegen.KeYFunctionReplacer;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class Parser {
    public static final String KEYWORD_JML_PRE = "requires";
    public static final String KEYWORD_JML_POST = "ensures";
    public static final String KEYWORD_JML_MODIFIABLE = "assignable";

    private final Map<String, String> variablesToStatements = new HashMap<>();

    public static String getContentFromJML(File javaFile, String methodName, String keyword, IFileUtil fileHandler) {
        if (javaFile != null) {
            List<String> linesOfFile = fileHandler.readFileInList(javaFile.getAbsolutePath());
            boolean methodFound = false;
            for (int i = linesOfFile.size() - 1; i >= 0; i--) {
                if (!methodFound) {
                    if (linesOfFile.get(i).contains(methodName + "(")) {
                        methodFound = true;
                    }
                } else {
                    String currLine = linesOfFile.get(i);
                    if (currLine.contains(keyword)) {
                        if (currLine.substring(currLine.length() - 1).contains(";")) {
                            return currLine
                                    .substring(currLine.indexOf(keyword) + keyword.length(), currLine.lastIndexOf(";"))
                                    .trim();
                        } else {
                            while (!linesOfFile.get(i + 1).substring(linesOfFile.get(i + 1).length() - 1)
                                    .contains(";")) {
                                currLine += linesOfFile.get(i + 1);
                                i++;
                            }
                            currLine += linesOfFile.get(i + 1);
                            return currLine
                                    .substring(currLine.indexOf(keyword) + keyword.length(), currLine.lastIndexOf(";"))
                                    .trim();
                        }
                    } else if (currLine.contains("}")) {
                        if (keyword == KEYWORD_JML_MODIFIABLE) {
                            return "";
                        } else {
                            return "true";
                        }

                    }
                }

            }
        }
        return "";

    }

    public static String rewriteJMLConditionToKeY(String condition) {

        condition = condition.replaceAll("==>", "->");
        condition = condition.replaceAll("<==>", "<->");
        condition = condition.replaceAll("==", "=");
        condition = condition.replaceAll("&&", "&");
        condition = condition.replaceAll("(?<==\\s?)true", "TRUE");
        condition = condition.replaceAll("(?<==\\s?)false", "FALSE");
        condition = condition.replaceAll("(\\w*)\\sinstanceof\\s(\\w*)", "$2::instance($1) = TRUE");
        return condition;
    }

    public static String getModifieableVarsFromCondition(Condition condition) {
        String variables = "\\nothing";
        if (!condition.getModifiables().isEmpty()) {
            variables = "";
            for (String mod : condition.getModifiables()) {
                variables += mod + ",";
            }
            variables = variables.substring(0, variables.length() - 1);
        }

        // remove return variable, as it must not be in assignables in java class
        if (variables.endsWith(",ret") || variables.contains(",ret,")) {
            variables = variables.replace(",ret", "");
        }
        if (variables.equals("ret")) {
            variables = "\\nothing";
        }
        if (variables.startsWith("ret,")) {
            variables = variables.replace("ret,", "");
        }
        return variables;
    }

    public static String getConditionFromCondition(String condition) {
        if (condition.contains("modifiable")) {
            String[] splittedCondition = condition.split(";", 2);
            if (splittedCondition.length > 1) {
                return splittedCondition[1].trim();
            }
        }
        condition = KeYFunctionReplacer.getInstance().restoreIn(condition);
        return condition;
    }

    public static List<String> getUnmodifiedVars(List<String> modifiedVars, List<JavaVariable> declaredVariables) {
        List<String> unmodifiedVariables = new ArrayList<String>();
        if (!modifiedVars.contains("\\everything")) {
            for (JavaVariable var : declaredVariables) {
                String varName = var.getName().split(" ")[1];
                if (!modifiedVars.contains(varName)) {
                    unmodifiedVariables.add(var.getName());
                }
            }
        }
        return unmodifiedVariables;
    }

    public static List<String> getModifiedVarsFromCondition(String condition) {
        String variables = null;
        List<String> modifiedVars = new ArrayList<String>();
        if (!condition.contains("modifiable(")) {
            modifiedVars.add("\\everything");
        } else if (condition.contains("modifiable(")) {
            variables = condition.split(";", 2)[0];
            if (variables != null) {
                variables = variables.substring(variables.indexOf("(") + 1, variables.indexOf(")"));
                variables = variables.replace(" ", "");
                variables = variables.replace(System.getProperty("line.separator"), "");
                modifiedVars = new ArrayList<String>(Arrays.asList(variables.split(",")));
            }
        }
        return modifiedVars;
    }

    public static String getModifieableVarsFromCondition(String condition) {
        String variables = "\\nothing";
        if (condition.contains("modifiable(") && condition.split(";").length > 1) {
            if (!condition.contains("modifiable(*)") && !condition.contains("nothing")) {
                variables = condition.split(";")[0];
                if (variables != null) {
                    variables = variables.substring(variables.indexOf("(") + 1, variables.indexOf(")"));
                    variables = variables.replace(" ", "");
                    variables = variables.replace(System.getProperty("line.separator"), "");
                }
            } else {
                variables = "\\everything";
            }
        }
        return variables;
    }

    public static String getModifieableVarsFromConditionExceptLocals(Condition condition,
            List<String> varsLinkedList, List<JavaVariable> vars, JavaVariable returnVar) {
        String variables = getModifieableVarsFromCondition(condition);
        if (variables.contains("nothing") || variables.contains("everything")) {
            return variables;
        } else {
            String[] assignableVariables = variables.replaceAll("this\\.", "").split(",");
            for (int i = 0; i < assignableVariables.length; i++) {
                assignableVariables[i] = assignableVariables[i].replaceAll("\\[.*\\]", "\\[\\*\\]");
            }
            variables = "";
            for (String modVar : assignableVariables) {
                boolean isLocal = false;
                if (varsLinkedList != null && varsLinkedList.size() > 0) {
                    for (String var : varsLinkedList) {
                        if (modVar.replaceAll("\\[.*\\]", "").equals(var.split(" ")[1])) {
                            isLocal = true;
                        }
                    }
                }
                if (vars != null && vars.size() > 0) {
                    for (JavaVariable var : vars) {
                        if (modVar.replaceAll("\\[.*\\]", "").equals(var.getName().split(" ")[1])
                                && var.getKind().equals(JavaVariableKind.LOCAL)) {
                            isLocal = true;
                        }
                    }
                }
                if (returnVar != null) {
                    if (modVar.replaceAll("\\[.*\\]", "").equals(returnVar.getName().split(" ")[1])) {
                        isLocal = true;
                    }
                }
                if (!isLocal && !variables.contains(modVar)) {
                    if (variables.isEmpty()) {
                        variables = modVar;
                    } else {
                        variables = variables + "," + modVar;
                    }
                }
            }
        }
        if (variables.isEmpty()) {
            return variables = "\\nothing";
        }
        return variables;
    }

    public static String processGlobalConditions(List<Condition> globalConditions, List<String> localVars,
            String preCondition) {
        String result = "";
        HashSet<String> conditionsSet = new HashSet<>();
        for (Condition c : globalConditions) {
            // Check if condition contains local variables:
            boolean isLocal = false;
            for (String v : localVars) {
                if (c.getCondition().contains(v.substring(v.indexOf(" ")).trim())) {
                    isLocal = true;
                }
            }
            if (preCondition.contains(c.getCondition()) || c.getCondition().contains("<inv>")) {
                continue;
            }
            if (!isLocal) {
                conditionsSet.add(rewriteConditionToJML(c.getCondition()));
            } else {
                System.out.println("[WARNING] Did not add global condition '" + c.getCondition()
                        + "' to JML annotation, because it contains access to a local variable.");
            }
        }
        for (String c : conditionsSet) {
            if (result.isEmpty()) {
                result += c;
            } else {
                result += " & " + c;
            }
        }

        return result;
    }

    public static String rewriteConditionToJML(String condition) {
        condition = condition.replaceAll("(?<!<|>|!|=)(\\s*=\\s*)(?!<|>|=)", " == ");
        condition = condition.replaceAll("->", "==>");
        condition = condition.replaceAll("<->", "<==>");
        condition = condition.replaceAll("&", "&&");
        condition = condition.replace("|", "||");
        condition = condition.replaceAll("(?<==\\s?)TRUE", "true");
        condition = condition.replaceAll("(?<==\\s?)FALSE", "false");
        condition = condition.replaceAll("(\\w*)::exactInstance\\((\\w*)\\)\\s*=\\s*TRUE", "$2 instanceof $1");
        condition = condition.replaceAll(".<created>\\s*=\\s*TRUE", " != null");
        condition = condition.replaceAll(".<created>\\s*=\\s*FALSE", " == null");
        condition = KeYFunctionReplacer.getInstance().restoreIn(condition);
        return condition;
    }

    public static String getMethodStubFromFile(String className, String methodName, IFileUtil fileHandler) {
        String methodStub = "";
        File file = fileHandler.getClassFile(className);
        boolean methodFound = false;
        int braketCounter = 0;
        if (file != null) {
            List<String> linesOfFile = fileHandler.readFileInList(file.getAbsolutePath());
            for (int i = 0; i < linesOfFile.size(); i++) {
                String currLine = linesOfFile.get(i);
                if (!methodFound) {
                    if (currLine.contains(methodName + "(")) {
                        methodFound = true;
                        methodStub = currLine;
                        braketCounter++;
                    }
                } else {
                    methodStub += currLine;
                    if (currLine.contains("{")) {
                        braketCounter++;
                    }
                    if (currLine.contains("}")) {
                        braketCounter--;
                    }
                    if (currLine.contains("}") && braketCounter == 0) {
                        return methodStub;
                    }
                }
            }
        }
        return methodStub;
    }

    public static String getModifieableVarsFromCondition2(String condition, LinkedList<String> vars) {
        String variables = getModifieableVarsFromCondition(condition);
        System.out.println("vars: " + variables);
        if (variables.contains("nothing") || variables.contains("everything")) {
            return variables;
        } else {
            String[] assignableVariables = variables.split(",");
            variables = "";
            if (assignableVariables[0].startsWith("this.")) {
                assignableVariables[0] = assignableVariables[0].replaceAll("\\[.*\\]", "\\[\\*\\]");
                variables = assignableVariables[0];
            }
            for (int i = 1; i < assignableVariables.length; i++) { // only global vars are modifiable
                if (assignableVariables[i].startsWith("this.")) {
                    assignableVariables[i] = assignableVariables[i].replaceAll("\\[.*\\]", "\\[\\*\\]");
                    if (variables.isEmpty()) {
                        variables = assignableVariables[i];
                    } else if (!Arrays.stream(variables.split(",")).anyMatch(assignableVariables[i]::equals)) {
                        variables = variables + "," + assignableVariables[i];
                    }
                }
            }
        }
        if (variables.isEmpty()) {
            return "\\nothing";
        }
        return variables;
    }
}
