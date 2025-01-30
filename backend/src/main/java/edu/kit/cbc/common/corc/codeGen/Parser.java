package edu.kit.cbc.common.corc.codeGen;

import java.util.HashSet;
import java.util.LinkedList;

import de.tu_bs.cs.isf.cbc.cbcmodel.Condition;
import de.tu_bs.cs.isf.cbc.cbcmodel.GlobalConditions;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariable;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariables;
import de.tu_bs.cs.isf.cbc.cbcmodel.VariableKind;

public class Parser {
    public static final String KEYWORD_JML_PRE = "requires";
    public static final String KEYWORD_JML_POST = "ensures";
    public static final String KEYWORD_JML_MODIFIABLE = "assignable";

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
    if (variables.endsWith(",ret") || variables.contains(",ret,"))
        variables = variables.replace(",ret", "");
    if (variables.equals("ret"))
        variables = "\\nothing";
    if (variables.startsWith("ret,"))
        variables = variables.replace("ret,", "");
    return variables;
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

    public static String processGlobalConditions(GlobalConditions globalConditions, LinkedList<String> localVars,
        String preCondition) {
    String result = "";
    HashSet<String> conditionsSet = new HashSet<>();
    for (Condition c : globalConditions.getConditions()) {
        // Check if condition contains local variables:
        boolean isLocal = false;
        for (String v : localVars) {
        if (c.getName().contains(v.substring(v.indexOf(" ")).trim()))
            isLocal = true;
        }
        if (preCondition.contains(c.getName()) || c.getName().contains("<inv>"))
        continue;
        if (!isLocal)
        conditionsSet.add(rewriteConditionToJML(c.getName()));
        else {
        System.out.println("[WARNING] Did not add global condition '" + c.getName()
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

    public static String getModifieableVarsFromConditionExceptLocals(Condition condition,
        LinkedList<String> varsLinkedList, JavaVariables vars, JavaVariable returnVar) {
    String variables = getModifieableVarsFromCondition(condition);
    if (variables.contains("nothing") || variables.contains("everything")) {
        return variables;
    } else {
        String[] assignableVariables = variables.replaceAll("this\\.", "").split(",");
        for (int i = 0; i < assignableVariables.length; i++) {
        assignableVariables[i] = assignableVariables[i].replaceAll("\\[.*\\]", "\\[\\*\\]");// .split("\\.")[0];
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
        if (vars != null && vars.getVariables().size() > 0) {
            for (JavaVariable var : vars.getVariables()) {
            if (modVar.replaceAll("\\[.*\\]", "").equals(var.getName().split(" ")[1])
                && var.getKind().equals(VariableKind.LOCAL)) {
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
}
