package edu.kit.cbc.common.corc.codeGen;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.LinkedList;
import java.util.regex.Pattern;

import de.tu_bs.cs.isf.cbc.cbcmodel.AbstractStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.CbCFormula;
import de.tu_bs.cs.isf.cbc.cbcmodel.CompositionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.GlobalConditions;
import de.tu_bs.cs.isf.cbc.cbcmodel.JavaVariable;
import de.tu_bs.cs.isf.cbc.cbcmodel.Rename;
import de.tu_bs.cs.isf.cbc.cbcmodel.Renaming;
import de.tu_bs.cs.isf.cbc.cbcmodel.SelectionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.SmallRepetitionStatement;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.AbstractStatementImpl;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.CompositionStatementImpl;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.MethodStatementImpl;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.OriginalStatementImpl;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.ReturnStatementImpl;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.SelectionStatementImpl;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.SkipStatementImpl;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.SmallRepetitionStatementImpl;
import de.tu_bs.cs.isf.cbc.cbcmodel.impl.StrengthWeakStatementImpl;


public class ConstructCodeBlock {

    private static boolean handleInnerLoops = true;
    private static Renaming renaming = null;
    private static int positionIndex = 0;
    private static JavaVariable returnVariable = null;

    public static void constructGlobalVariables() throws IOException {
    }

    private static StringBuffer insertTabs(StringBuffer s) {
        for (int i = 0; i < positionIndex; i++) {
            s.append("\t");
        }
        return s;
    }

    public static String constructCodeBlockForExport(CbCFormula formula, GlobalConditions globalConditions,
            Renaming renaming, LinkedList<String> vars, JavaVariable returnVar, String signatureString,
            String[] config) {
        handleInnerLoops = true;

        String modifiableVariables = Parser.getModifieableVarsFromConditionExceptLocals(
                formula.getStatement().getPostCondition(), vars, null, returnVar);
        modifiableVariables = modifiableVariables.replaceAll("\\)", "").replaceAll("\\(", "");
        String postCondition = Parser.getConditionFromCondition(formula.getStatement().getPostCondition().getName());

        String pre = createConditionJMLString(formula.getStatement().getPreCondition().getName(), renaming,
                Parser.KEYWORD_JML_PRE);
        if (globalConditions != null) {
            String processedGlobalConditions = Parser.processGlobalConditions(globalConditions, vars, pre);
            if (!processedGlobalConditions.isEmpty()) {
                pre = pre.replace(";\n", "");
                pre += " & " + processedGlobalConditions + ";\n";
            }
        }

        pre = useRenamingCondition(pre);

        String post = createConditionJMLString(postCondition, renaming, Parser.KEYWORD_JML_POST);
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

        positionIndex = 2;// 2
        code = insertTabs(code);

        for (String var : vars) {// declare variables
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
            if (renaming != null)
                s = useRenamingCondition(s);
            code.append(s);
        } else {
            s = constructCodeBlockOfChildStatement(formula.getStatement());
            if (renaming != null)
                s = useRenamingCondition(s);
            code.append(s);
        }

        Pattern void_pattern = Pattern.compile("(?<![a-zA-Z0-9])(void)(?![a-zA-Z0-9])");
        Pattern return_pattern = Pattern.compile("(?<![a-zA-Z0-9])(return)(?![a-zA-Z0-9])");
        if (returnVariable != null && !void_pattern.matcher(signatureString).find()
                && !return_pattern.matcher(code.toString()).find()) {
            code.append("\t\treturn " + returnVariable.getName().split(" ")[1] + ";");
        }
        code.append("\n\t}");// }

        returnVariable = null;
        return code.toString();
    }

    private static String translateOldVariablesToJML(String post, LinkedList<String> vars) {
        for (String var : vars) {
            if (var.contains("old_")) {
                String varNameWithoutOld = var.substring(var.indexOf("_") + 1);
                String varNameWithoutType = var.substring(var.indexOf(" ") + 1);
                post = post.replaceAll(varNameWithoutType, "\\\\old(" + varNameWithoutOld + ")");
            }

        }
        return post;
    }

    private static String constructCodeBlockOfChildStatement(AbstractStatement refinement) {
        if (refinement.getClass().equals(AbstractStatementImpl.class)
                || refinement.getClass().equals(OriginalStatementImpl.class)
                || refinement.getClass().equals(MethodStatementImpl.class)) {
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

            String abstractStatementSplit[] = allStatements.split(";");
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
            // The reason for the empty try block, is that the exception occurs every time
            // but the
            // values get set anyways. In order for the program to not crash we need to
            // catch that
            // exception. This should probably be handled differently though...
            try {
                refinement.setCodeRepresentation(statements);
            } catch (IllegalStateException e) {
            }
            // return statements;
            return statements;
            // return refinement.getName() + "\n";
        } else if (refinement.getClass().equals(SkipStatementImpl.class)) {
            String rep = ";\n";
            try {
                refinement.setCodeRepresentation(rep);
            } catch (IllegalStateException e) {
            }
            return rep;
        } else if (refinement.getClass().equals(ReturnStatementImpl.class)) {
            String rep = "return " + refinement.getName() + "\n";
            if (returnVariable != null) {// In case of void method with "return;", returnVariable will be null
                String returnString = returnStatement(returnVariable.getName().split(" ")[1],
                        refinement.getName().trim());
                if (returnString.isEmpty()) {
                    try {
                        refinement.setCodeRepresentation(rep);
                    } catch (IllegalStateException e) {
                    }
                    return rep;
                }
                for (int i = 0; i < positionIndex; i++) {
                    returnString = returnString + "\t";
                }
                returnString = returnString + "return " + returnVariable.getName().split(" ")[1] + ";\n";
                try {
                    refinement.setCodeRepresentation(returnString);
                } catch (IllegalStateException e) {
                }
                return returnString;
            }
            try {
                refinement.setCodeRepresentation(rep);
            } catch (IllegalStateException e) {
            }
            return rep;
        } else if (refinement.getClass().equals(SelectionStatementImpl.class)) {
            return constructSelection((SelectionStatement) refinement);
        } else if (refinement.getClass().equals(CompositionStatementImpl.class)) {
            return constructComposition((CompositionStatement) refinement);
        } else if (refinement.getClass().equals(SmallRepetitionStatementImpl.class)) {
            return constructSmallRepetition((SmallRepetitionStatement) refinement);
        } else if (refinement.getClass().equals(StrengthWeakStatementImpl.class)) {
            if (refinement.getRefinement() != null) {
                return constructCodeBlockOfChildStatement(refinement.getRefinement());
            } else {
                return refinement.getName() + ";\n";
            }
        }
        return null;
    }

    private static String returnStatement(String variableName, String refinementName) {
        String s = "";
        if (!refinementName.trim().split(";")[0].equals(variableName)
                && !refinementName.trim().split(";")[0].equals("this." + variableName)) {
            if (refinementName.contains("=") && refinementName.charAt(refinementName.indexOf('=') + 1) != '='
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
            String guard = statement.getGuards().get(0).getName();

            guard = rewriteGuardToJavaCode(applyPredicates(guard));

            if (guard.trim().equals("TRUE"))
                guard = "true";
            if (guard.trim().equals("FALSE"))
                guard = "false";

            try {
                statement.getGuards().get(0).setCodeRepresentation("if (" + guard + ") {\n");
            } catch (IllegalStateException e) {
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
            String guard = statement.getGuards().get(i).getName();
            // guard = guard.replaceAll("\\s=\\s", "==");
            guard = rewriteGuardToJavaCode(applyPredicates(guard));

            if (guard.trim().equals("TRUE"))
                guard = "true";
            if (guard.trim().equals("FALSE"))
                guard = "false";

            try {
                statement.getGuards().get(i).setCodeRepresentation(" else if (" + guard + ") {\n");
            } catch (IllegalStateException e) {
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

    private static String constructComposition(CompositionStatement statement) {
        StringBuffer buffer = new StringBuffer();

        if (statement.getFirstStatement().getRefinement() != null) {
            buffer.append(constructCodeBlockOfChildStatement(statement.getFirstStatement().getRefinement()));
        } else {
            buffer.append(constructCodeBlockOfChildStatement(statement.getFirstStatement()));
        }

        // commented out to prevent generation of assets from intermediate condition
        /*
         * for (int i = 0; i < positionIndex; i++) { buffer.append("\t"); }
         * if(statement.getIntermediateCondition().getName() != "" && withAsserts) {
         * buffer.append("assert " +
         * statement.getIntermediateCondition().getName().replace("\n",
         * " ").replace("\r", " ") + ";\n"); }
         */
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

    private static String constructSmallRepetition(SmallRepetitionStatement statement) {
        StringBuffer buffer = new StringBuffer();
        if (handleInnerLoops) {
            // commented out to prevent generating invariants to java class at varcorc oo
            /*
             * if (withInvariants) { String invariant = statement.getInvariant().getName();
             * invariant = Parser.rewriteConditionToJML(invariant); //invariant =
             * useRenamingCondition(invariant); buffer.append("//@ loop_invariant " +
             * invariant.replaceAll("\\r\\n", "") + ";\n"); for (int i = 0; i <
             * positionIndex; i++) { buffer.append("\t"); } buffer.append("//@ decreases " +
             * statement.getVariant().getName() + ";\n"); }
             */
            String guard = statement.getGuard().getName();
            // guard = guard.replaceAll("\\s=\\s", "==");
            guard = rewriteGuardToJavaCode(guard);
            /*
             * for (int i = 0; i < positionIndex; i++) { buffer.append("\t"); }
             */

            if (guard.trim().equals("TRUE"))
                guard = "true";
            if (guard.trim().equals("FALSE"))
                guard = "false";

            try {
                statement.getGuard().setCodeRepresentation("while (" + guard + ") {\n");
            } catch (IllegalStateException e) {
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

    public static String createConditionJMLString(String condition, Renaming renaming, String postOrPre) {
        if (condition.equals("")) {
            return condition;
        } else {
            String jmlCondition = Parser.rewriteConditionToJML(applyPredicates(condition));
            if (renaming != null) {
                ConstructCodeBlock.renaming = renaming;
                // jmlCondition = useRenamingCondition(jmlCondition);
            }
            jmlCondition = jmlCondition.replaceAll(System.getProperty("line.separator"), "");
            jmlCondition = "\t@ " + postOrPre + " " + jmlCondition + ";\n";
            jmlCondition = KeYFunctionReplacer.getInstance().restoreIn(jmlCondition);
            return jmlCondition;
        }

    }

    private static String applyPredicates(String condition) {
        return condition;
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
        if (renaming != null) {
            for (Rename rename : renaming.getRename()) {
                toRename = toRename.replaceAll(rename.getNewName(), rename.getFunction());
            }
        }
        return toRename;
    }
}
