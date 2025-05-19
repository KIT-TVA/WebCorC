package edu.kit.cbc.common.corc.codegen;

import edu.kit.cbc.common.corc.Parser;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.Renaming;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.CompositionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.ReturnStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SelectionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SkipStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SmallRepetitionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.Statement;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import java.util.regex.Pattern;

public class ConstructCodeBlock {

    private static boolean handleInnerLoops = true;
    private static boolean withInvariants = false;
    private static List<Renaming> renamings = null;
    private static int positionIndex = 0;
    private static String line;
    private static BufferedReader br;
    private static JavaVariable returnVariable = null;

    /**
     * Creates verified code block.
     */
    public static String constructCodeBlockAndVerify(AbstractStatement statement, boolean innerLoops) {
        handleInnerLoops = innerLoops;
        withInvariants = false;
        StringBuffer code = new StringBuffer();

        if (statement instanceof SmallRepetitionStatement repStatement) {
            if (repStatement.getLoopStatement().getRefinement() != null) {
                code.append(constructCodeBlockOfChildStatement(repStatement.getLoopStatement().getRefinement()));
            } else {
                code.append(constructCodeBlockOfChildStatement(repStatement.getLoopStatement()));
            }
        }
        return code.toString();
    }

    public static StringBuffer getJmlAnnotations(StringBuffer buffer, BufferedReader br) throws IOException {
        buffer.setLength(0);
        while (line != null && line.contains("@")) { // get jml annotations
            buffer.append(line);
            buffer.append("\n");
            line = br.readLine();
        }
        return buffer;
    }

    private static String translateOldVariablesToJML(String post, List<String> vars) {
        for (String var : vars) {
            if (var.contains("old_")) {
                String varNameWithoutOld = var.substring(var.indexOf("_") + 1);
                String varNameWithoutType = var.substring(var.indexOf(" ") + 1);
                post = post.replaceAll(varNameWithoutType, "\\\\old(" + varNameWithoutOld + ")");
            }

        }
        return post;
    }

    private static StringBuffer insertTabs(StringBuffer s) {
        for (int i = 0; i < positionIndex; i++) {
            s.append("\t");
        }
        return s;
    }

    public static String constructCodeBlockForExport(CbCFormula formula, List<Condition> globalConditions,
            List<Renaming> renamings, List<String> vars, JavaVariable returnVar, String signatureString,
            String[] config) {
        handleInnerLoops = true;

        String modifiableVariables = Parser.getModifieableVarsFromConditionExceptLocals(
                formula.getStatement().getPostCondition(), vars, null, returnVar);
        modifiableVariables = modifiableVariables.replaceAll("\\)", "").replaceAll("\\(", "");
        String postCondition = Parser
                .getConditionFromCondition(formula.getStatement().getPostCondition().getCondition());

        String pre = createConditionJMLString(formula.getStatement().getPreCondition().getCondition(), renamings,
                Parser.KEYWORD_JML_PRE);
        if (globalConditions != null) {
            String processedGlobalConditions = Parser.processGlobalConditions(globalConditions, vars, pre);
            if (!processedGlobalConditions.isEmpty()) {
                pre = pre.replace(";\n", "");
                pre += " & " + processedGlobalConditions + ";\n";
            }
        }

        pre = useRenamingCondition(pre);

        String post = createConditionJMLString(postCondition, renamings, Parser.KEYWORD_JML_POST);
        post = translateOldVariablesToJML(post, vars);
        post = useRenamingCondition(post);

        if (returnVar != null) {
            String returnValueName = returnVar.getName().split(" ")[1];
            post = post.replaceAll("(?<=\\W)" + returnValueName + "(?=\\W)", "\\\\result");
            post = post.replaceAll("(?<=\\W)\\\\\\\\result(?=\\W)", "\\\\result");
            returnVariable = returnVar;
        }

        StringBuffer code = new StringBuffer();
        code.append("\t/*@\n" + "\t@ normal_behavior\n\t" // + "@ requires "
                + pre.replaceAll(System.getProperty("line.separator"), "").replaceAll("\n", "").replaceAll("\t", "")
                + "\n\t"// + ";\n" //+ "@ ensures "
                + post.replaceAll(System.getProperty("line.separator"), "").replaceAll("\n", "").replaceAll("\t",
                        "")/*
                            * + ";\n"
                            */
                + "\n\t@ assignable " + modifiableVariables + ";\n" + "\t@*/\n\t"
                + /* "public /*@helper@* / "+ */ signatureString + " {\n");

        positionIndex = 2;
        code = insertTabs(code);

        for (String var : vars) { // declare variables
            if (!var.contains("old_")) {
                code.append(var + ";\n");
                code = insertTabs(code);
            }
        }
        // initialize local variables
        /*
         * for(String var : vars) {//declare variables // TODO: Masterarbeit Hayreddin -
         * Initialize all variables directly if
         * (REGEX_PRIMITIVE_INTEGERS.matcher(var).find()) { code.append(var +
         * " = 0;\n"); code = insertTabs(code); } else
         * if(REGEX_PRIMITIVE_FLOAT.matcher(var).find()) { code.append(var +
         * " = 0.0;\n"); code = insertTabs(code); } else if(var.contains("boolean")) {
         * code.append(var + " = false;\n"); code = insertTabs(code); } else {
         * code.append(var + " = null;\n"); code = insertTabs(code); } }
         */
        String s;
        if (formula.getStatement().getRefinement() != null) {
            s = constructCodeBlockOfChildStatement(formula.getStatement().getRefinement());
            if (renamings != null) {
                s = useRenamingCondition(s);
            }
            code.append(s);
        } else {
            s = constructCodeBlockOfChildStatement(formula.getStatement());
            if (renamings != null) {
                s = useRenamingCondition(s);
            }
            code.append(s);
        }

        final Pattern void_pattern = java.util.regex.Pattern.compile("(?<![a-zA-Z0-9])(void)(?![a-zA-Z0-9])");
        final Pattern return_pattern = Pattern.compile("(?<![a-zA-Z0-9])(return)(?![a-zA-Z0-9])");
        if (returnVariable != null && !void_pattern.matcher(signatureString).find()
                && !return_pattern.matcher(code.toString()).find()) {
            code.append("\t\treturn " + returnVariable.getName().split(" ")[1] + ";");
        }
        code.append("\n\t}");

        returnVariable = null;
        return code.toString();
    }

    public static String constructMethodStubsForExport(CbCFormula formula, List<Renaming> renamings,
            List<JavaVariable> vars) {
        handleInnerLoops = true;
        withInvariants = false;

        String modifiableVariables = edu.kit.cbc.common.corc.Parser
                .getModifieableVarsFromCondition(formula.getStatement().getPostCondition().getCondition());
        String postCondition = edu.kit.cbc.common.corc.Parser
                .getConditionFromCondition(formula.getStatement().getPostCondition().getCondition());

        String pre = createConditionJMLString(formula.getStatement().getPreCondition().getCondition(), renamings,
                edu.kit.cbc.common.corc.Parser.KEYWORD_JML_PRE);
        String post = createConditionJMLString(postCondition, renamings,
                edu.kit.cbc.common.corc.Parser.KEYWORD_JML_POST);

        String returnValueType = "void";
        String parameters = "";
        for (JavaVariable var : vars) {
            switch (var.getKind()) {
                case PARAM:
                    if (parameters.equals("")) {
                        parameters += var.getName();
                    } else {
                        parameters += ", " + var.getName();
                    }
                    break;
                case RETURN:
                    String[] splitNameAndType = var.getName().split(" ");
                    // get type of variable not whole name
                    returnValueType = splitNameAndType[0];
                    // get only the name
                    String returnValueName = splitNameAndType[1];
                    post = post.replaceAll("(?<=\\W)" + returnValueName + "(?=\\W)", "\\\\result");
                    break;
                default:
                    break;
            }
        }
        StringBuffer code = new StringBuffer();
        System.out.println(System.getProperties());
        code.append("public class MethodStubs {\n/*@\n@ normal_behavior\n" + pre + post + "@assignable "
                + modifiableVariables + ";\n" + "@*/\n" + "public static " + returnValueType + " " + formula.getName()
                + "(" + parameters + ") {\n" + "}");

        // traverse through tree and add stubs for called methods to the String
        if (formula.getStatement() != null) {
            code.append(constructMethodStubOfChildStatement(formula.getStatement().getRefinement()));
        } else {
            code.append(constructMethodStubOfChildStatement(formula.getStatement()));
        }

        code.append("\n}");
        return code.toString();
    }

    public static String constructMethodStubsForExport(CbCFormula formula, Renaming renaming, List<JavaVariable> vars,
            String feature, String project) {
        handleInnerLoops = true;
        withInvariants = false;

        String modifiableVariables = edu.kit.cbc.common.corc.Parser
                .getModifieableVarsFromCondition(formula.getStatement().getPostCondition().getCondition());
        if (vars != null) {
            for (JavaVariable actVar : vars) {
                if (actVar.getKind().toString() != "PARAM") {
                    String[] splitName = actVar.getName().split(" ");
                    modifiableVariables = modifiableVariables.replaceAll("," + splitName[splitName.length - 1], "");
                    modifiableVariables = modifiableVariables.replaceAll(splitName[splitName.length - 1] + ";", ";");
                    modifiableVariables = modifiableVariables.replaceAll(splitName[splitName.length - 1] + ",", "");
                }
            }
        }

        String postCondition = edu.kit.cbc.common.corc.Parser
                .getConditionFromCondition(formula.getStatement().getPostCondition().getCondition());

        String pre = createConditionJMLString(formula.getStatement().getPreCondition().getCondition(), renamings,
                edu.kit.cbc.common.corc.Parser.KEYWORD_JML_PRE);
        String post = createConditionJMLString(postCondition, renamings,
                edu.kit.cbc.common.corc.Parser.KEYWORD_JML_POST);

        String returnValueType = "void";
        String parameters = "";
        for (JavaVariable var : vars) {
            switch (var.getKind()) {
                case PARAM:
                    if (parameters.equals("")) {
                        parameters += var.getName();
                    } else {
                        parameters += ", " + var.getName();
                    }
                    break;
                case RETURN:
                    String[] splitNameAndType = var.getName().split(" ");
                    // get type of variable not whole name
                    returnValueType = splitNameAndType[0];
                    // get only the name
                    String returnValueName = splitNameAndType[1];
                    post = post.replaceAll("(?<=\\W)" + returnValueName + "(?=\\W)", "\\\\result");
                    break;
                case RETURN_PARAM:
                    String[] splitNameAndType2 = var.getName().split(" ");
                    // get type of variable not whole name
                    returnValueType = splitNameAndType2[0];
                    // get only the name
                    String returnValueName2 = splitNameAndType2[1];
                    post = post.replaceAll("(?<=\\W)" + returnValueName2 + "(?=\\W)", "\\\\result");
                    if (parameters.equals("")) {
                        parameters += var.getName();
                    } else {
                        parameters += ", " + var.getName();
                    }
                    break;
                default:
                    break;
            }
        }

        StringBuffer code = new StringBuffer();
        System.out.println(System.getProperties());
        code.append("    /*@\n    @ normal_behavior\n" + pre + post + "    @ assignable "
                + modifiableVariables + ";\n" + "    @*/\n" + "    public static " + returnValueType + " "
                + feature.toLowerCase()
                + "(" + parameters + ") {\n    }");

        // traverse through tree and add stubs for called methods to the String
        /*
         * if (formula.getStatement() != null) {
         * code.append(constructMethodStubOfChildStatement(formula.getStatement().
         * getRefinement()));
         * } else {
         * code.append(constructMethodStubOfChildStatement(formula.getStatement()));
         * }
         */

        return code.toString();
    }

    private static String constructMethodStubOfChildStatement(AbstractStatement refinement) {
        return switch (refinement) {
            case Statement s -> extractMethodNameFromStatement(refinement.getName());
            case SkipStatement ignored -> "";
            case ReturnStatement ignored -> "";
            case SelectionStatement s -> traverseSelection(s);
            case CompositionStatement s -> traverseComposition(s);
            case SmallRepetitionStatement s -> traverseSmallRepetition(s);
            default -> "";
        };
    }

    private static String constructCodeBlockOfChildStatement(AbstractStatement refinement) {
        if (refinement instanceof Statement) {
            // behandlung von AbstractStatementImpl nur von Tobi
            String allStatements = refinement.getName().replace("\r\n", "");
            allStatements = allStatements.trim();
            allStatements = allStatements.replaceAll("\\s+", " ");
            // allStatements = allStatements.split("\\w\\=\\w")[0]+ " = " +
            // allStatements.split("\\w\\=\\w")[1];
            allStatements = allStatements.replace("/ =", " /= ");
            allStatements = allStatements.replace("+ =", " += ");
            allStatements = allStatements.replace("- =", " -= ");
            allStatements = allStatements.replace("* =", " *= ");

            String[] abstractStatementSplit = allStatements.split(";");
            String statements;
            if (abstractStatementSplit.length > 1) {
                statements = abstractStatementSplit[0].trim() + ";\n";
                for (int i = 1; i < abstractStatementSplit.length; i++) {
                    for (int j = 0; j < positionIndex; j++) {
                        statements = statements + "\t";
                    }
                    statements = statements + (abstractStatementSplit[i].trim() + ";\n");
                }
            } else {
                statements = allStatements + "\n";
            }
            // return statements;
            return statements;
            // return refinement.getName() + "\n";
        } else if (refinement instanceof SkipStatement) {
            return ";\n";
        } else if (refinement instanceof ReturnStatement) {
            if (returnVariable != null) { // In case of void method with "return;", returnVariable will be null
                String returnString = returnStatement(returnVariable.getName().split(" ")[1],
                        refinement.getName().trim());
                if (returnString.isEmpty()) {
                    return "return " + refinement.getName() + "\n";
                }
                for (int i = 0; i < positionIndex; i++) {
                    returnString = returnString + "\t";
                }
                returnString = returnString + "return " + returnVariable.getName().split(" ")[1] + ";\n";
                return returnString;
            }
            return "return " + refinement.getName() + "\n";
        } else if (refinement instanceof SelectionStatement) {
            return constructSelection((SelectionStatement) refinement);
        } else if (refinement instanceof CompositionStatement) {
            return constructComposition((CompositionStatement) refinement);
        } else if (refinement instanceof SmallRepetitionStatement) {
            return constructSmallRepetition((SmallRepetitionStatement) refinement);
        }

        return null;
    }

    private static String returnStatement(String variableName, String refinementName) {
        String s = "";
        if (!refinementName.trim().split(";")[0].equals(variableName)
                && !refinementName.trim().split(";")[0].equals("this." + variableName)) {
            if (refinementName.contains("=")
                    && refinementName.charAt(refinementName.indexOf('=') + 1) != '='
                    && refinementName.charAt(refinementName.indexOf('=') - 1) != '>'
                    && refinementName.charAt(refinementName.indexOf('=') - 1) != '<') {
                // s = variableName + refinementName.replace(refinementName.subSequence(0,
                // refinementName.indexOf('=')), "") + "\n";
                s = refinementName + "\n";
                if (!refinementName.trim().substring(0, refinementName.indexOf('=') - 1).equals(variableName)) {
                    for (int i = 0; i < positionIndex; i++) {
                        s = s + "\t";
                    }
                    s = s + variableName + " = " + refinementName.trim().split("=")[0] + ";\n";
                }
            } else {
                s = variableName + " = " + refinementName + "\n";
            }
        }
        return s;
    }

    private static String constructSelection(SelectionStatement statement) {
        StringBuffer buffer = new StringBuffer();

        if (!statement.getCommands().isEmpty()) {
            String guard = statement.getGuards().get(0).getCondition();

            guard = rewriteGuardToJavaCode(guard);

            if (guard.trim().equals("TRUE")) {
                guard = "true";
            }
            if (guard.trim().equals("FALSE")) {
                guard = "false";
            }

            buffer.append("if (" + guard + ") {\n");

            positionIndex++;
            if (statement.getCommands().get(0).getRefinement() != null) {
                for (int i = 0; i < positionIndex; i++) {
                    buffer.append("\t");
                }
                buffer.append(constructCodeBlockOfChildStatement(statement.getCommands().get(0).getRefinement()));
                positionIndex--;
                for (int i = 0; i < positionIndex; i++) {
                    buffer.append("\t");
                }
                buffer.append("}");
            } else {
                for (int i = 0; i < positionIndex; i++) {
                    buffer.append("\t");
                }
                buffer.append(constructCodeBlockOfChildStatement(statement.getCommands().get(0)));
                positionIndex--;
                for (int i = 0; i < positionIndex; i++) {
                    buffer.append("\t");
                }
                buffer.append("}");
            }
        }

        for (int i = 1; i < statement.getCommands().size(); i++) {
            String guard = statement.getGuards().get(i).getCondition();
            // guard = guard.replaceAll("\\s=\\s", "==");
            guard = rewriteGuardToJavaCode(guard);

            if (guard.trim().equals("TRUE")) {
                guard = "true";
            }
            if (guard.trim().equals("FALSE")) {
                guard = "false";
            }

            buffer.append(" else if (" + guard + ") {\n");
            positionIndex++;
            if (statement.getCommands().get(i).getRefinement() != null) {
                for (int j = 0; j < positionIndex; j++) {
                    buffer.append("\t");
                }
                buffer.append(constructCodeBlockOfChildStatement(statement.getCommands().get(i).getRefinement()));
                positionIndex--;
                for (int j = 0; j < positionIndex; j++) {
                    buffer.append("\t");
                }
                buffer.append("}");
            } else {
                for (int j = 0; j < positionIndex; j++) {
                    buffer.append("\t");
                }
                buffer.append(constructCodeBlockOfChildStatement(statement.getCommands().get(i)));
                positionIndex--;
                for (int j = 0; j < positionIndex; j++) {
                    buffer.append("\t");
                }
                buffer.append("}");
            }

        }

        buffer.append("\n");
        return buffer.toString();
    }

    private static String traverseSelection(SelectionStatement statement) {
        StringBuffer buffer = new StringBuffer();
        for (AbstractStatement command : statement.getCommands()) {
            if (command.getRefinement() != null) {
                buffer.append(constructMethodStubOfChildStatement(command.getRefinement()));
            } else {
                buffer.append(constructMethodStubOfChildStatement(command));
            }
        }
        return buffer.toString();
    }

    private static String constructComposition(CompositionStatement statement) {
        StringBuffer buffer = new StringBuffer();

        if (statement.getFirstStatement().getRefinement() != null) {
            buffer.append(constructCodeBlockOfChildStatement(statement.getFirstStatement().getRefinement()));
        } else {
            buffer.append(constructCodeBlockOfChildStatement(statement.getFirstStatement()));
        }

        for (int i = 0; i < positionIndex; i++) {
            buffer.append("\t");
        }

        if (statement.getSecondStatement().getRefinement() != null) {
            buffer.append(constructCodeBlockOfChildStatement(statement.getSecondStatement().getRefinement()));
        } else {
            buffer.append(constructCodeBlockOfChildStatement(statement.getSecondStatement()));
        }

        return buffer.toString();
    }

    private static String traverseComposition(CompositionStatement statement) {
        StringBuffer buffer = new StringBuffer();
        if (statement.getFirstStatement().getRefinement() != null) {
            buffer.append(constructMethodStubOfChildStatement(statement.getFirstStatement().getRefinement()));
        } else {
            buffer.append(constructMethodStubOfChildStatement(statement.getFirstStatement()));
        }
        if (statement.getSecondStatement().getRefinement() != null) {
            buffer.append(constructMethodStubOfChildStatement(statement.getSecondStatement().getRefinement()));
        } else {
            buffer.append(constructMethodStubOfChildStatement(statement.getSecondStatement()));
        }
        return buffer.toString();
    }

    private static String constructSmallRepetition(SmallRepetitionStatement statement) {
        StringBuffer buffer = new StringBuffer();
        if (handleInnerLoops) {
            if (withInvariants) {
                String invariant = statement.getInvariant().getCondition();
                invariant = edu.kit.cbc.common.corc.Parser.rewriteConditionToJML(invariant);
                // invariant = useRenamingCondition(invariant);
                buffer.append("//@ loop_invariant " + invariant.replaceAll("\\r\\n", "") + ";\n");
                for (int i = 0; i < positionIndex; i++) {
                    buffer.append("\t");
                }
                buffer.append("//@ decreases " + statement.getVariant().getCondition() + ";\n");
            }
            String guard = statement.getGuard().getCondition();
            // guard = guard.replaceAll("\\s=\\s", "==");
            guard = rewriteGuardToJavaCode(guard);
            for (int i = 0; i < positionIndex; i++) {
                buffer.append("\t");
            }

            if (guard.trim().equals("TRUE")) {
                guard = "true";
            }
            if (guard.trim().equals("FALSE")) {
                guard = "false";
            }

            buffer.append("while (" + guard + ") {\n");
            positionIndex++;
            for (int i = 0; i < positionIndex; i++) {
                buffer.append("\t");
            }
            if (statement.getLoopStatement().getRefinement() != null) {
                buffer.append(constructCodeBlockOfChildStatement(statement.getLoopStatement().getRefinement()));
            } else {
                buffer.append(constructCodeBlockOfChildStatement(statement.getLoopStatement()));
            }
            positionIndex--;
            for (int i = 0; i < positionIndex; i++) {
                buffer.append("\t");
            }
            buffer.append("}\n");
        }
        return buffer.toString();
    }

    private static String traverseSmallRepetition(SmallRepetitionStatement statement) {
        StringBuffer buffer = new StringBuffer();
        if (handleInnerLoops) {
            if (statement.getLoopStatement().getRefinement() != null) {
                buffer.append(constructMethodStubOfChildStatement(statement.getLoopStatement().getRefinement()));
            } else {
                buffer.append(constructMethodStubOfChildStatement(statement.getLoopStatement()));
            }
        }
        return buffer.toString();
    }

    private static String createConditionJMLString(String condition, List<Renaming> renamings, String postOrPre) {
        if (condition.equals("")) {
            return condition;
        } else {
            String jmlCondition = Parser.rewriteConditionToJML(condition);
            if (renamings != null) {
                ConstructCodeBlock.renamings = renamings;
                // jmlCondition = useRenamingCondition(jmlCondition);
            }
            jmlCondition = jmlCondition.replaceAll(System.getProperty("line.separator"), "");
            jmlCondition = "\t@ " + postOrPre + " " + jmlCondition + ";\n";
            return jmlCondition;
        }

    }

    private static String rewriteGuardToJavaCode(String guard) {
        guard = guard.replaceAll("(?<!<|>|!|=)(\\s*=\\s*)(?!<|>|=)", " == ");
        guard = guard.replace("&", "&&");
        guard = guard.replace("|", "||");
        guard = guard.replaceAll("\\s+TRUE\\s*|TRUE\\s+", " true ");
        guard = guard.replaceAll("\\s+FALSE\\s*|FALSE\\s+", " false ");
        guard = guard.trim();
        return guard;
    }

    public static String useRenamingCondition(String toRename) {
        if (renamings != null) {
            for (Renaming rename : renamings) {
                toRename = toRename.replaceAll(rename.getNewName(), rename.getFunction());
            }
        }
        return toRename;
    }

    private static String extractMethodNameFromStatement(String statement) {
        // statement contains method call
        if (statement.contains(");")) {
            String methodName = statement;
            // replace xy.method() oder XY xy = new XY()
            if (methodName.contains(".") || methodName.contains("=")) {
                methodName = methodName.replaceFirst("([\\w\\[\\]]*\\s?)*(?:( )?=( )?)(?:new )?(?:\\w*\\.)?|\\w*(?:.)",
                        "");
            }
            methodName = methodName.replace(";", "");
            return "\npublic static void " + methodName + "{\n }";
        } else {
            return "";
        }
    }
}
