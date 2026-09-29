package edu.kit.ifbc.common.ifbcmodel.parsing.parser;

import edu.kit.cbc.common.corc.parsing.condition.ast.ExistsTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ForAllTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.OldTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.ArrayAcessTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.BinaryOperationTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.CallTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.LengthTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.parser.ast.UnaryOperationTree;
import edu.kit.cbc.common.corc.parsing.program.ast.AssignTree;
import edu.kit.cbc.common.corc.parsing.program.ast.BlockTree;
import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;

import java.util.HashSet;
import java.util.Set;
import java.util.logging.Logger;

// Original: webcorc/dev @ backend/src/main/java/edu/kit/cbc/common/corc/parsing/SemanticChecker.java
public class VariableParsing {
    private final static Logger LOGGER = Logger.getGlobal();

    private static final String DECLASSIFY_OPERATOR = "declassify";

    private static final java.util.List<String> IGNORED_VARIABLES = java.util.List.of("true", "false");

    public static String[] getRelevantVariables(Tree program, Set<String> variables) throws VariableParsingException {
        if (program == null) {
            return null;
        }
        Set<String> usedVariables = checkTree(program, variables);
        return usedVariables.toArray(new String[usedVariables.size()]);
    }


    public static String[] getAssignmentLHSVariables(Tree program, Set<String> variables) throws VariableParsingException {
        LOGGER.fine("programm: " + program + " instance of AssignTree: " + (program instanceof AssignTree));
        
        if (program == null || !(program instanceof AssignTree)) {
            return null;
        }
        AssignTree tree = (AssignTree) program;
        Set<String> usedVariables = checkTree(tree.name(), variables);
        return usedVariables.toArray(new String[usedVariables.size()]);
    }

    private static Set<String> checkTree(Tree node, Set<String> scope) throws VariableParsingException {
        if (node == null) {
            return null;
        }

        Set<String> variables = new HashSet<>();

        if (node instanceof ForAllTree forAll) {
            Set<String> newScope = new HashSet<>();
            if (forAll.variable() != null) {
                newScope.add(forAll.variable().name());
            }
            variables.addAll(checkTree(forAll.condition(), newScope));
        } else if (node instanceof ExistsTree exists) {
            Set<String> newScope = new HashSet<>();
            if (exists.variable() != null) {
                newScope.add(exists.variable().name());
            }
            variables.addAll(checkTree(exists.condition(), newScope));
        } else if (node instanceof IdentTree id) {
            String name = id.name();
            if (!scope.contains(name) && IGNORED_VARIABLES.stream().noneMatch(name::equalsIgnoreCase)) {
                throw new VariableParsingException("Variable '" + name + "' is used but not defined.");
            }
            variables.add(name);
        } else if (node instanceof LengthTree len) {
            if (!scope.contains(len.variable())) {
                throw new VariableParsingException("Variable '" + len.variable() + "' is used but not defined.");
            }
        } else if (node instanceof ArrayAcessTree arr) {
            variables.addAll(checkTree(arr.name(), scope));
            variables.addAll(checkTree(arr.expr(), scope));
        } else if (node instanceof BinaryOperationTree bin) {
            variables.addAll(checkTree(bin.lhs(), scope));
            variables.addAll(checkTree(bin.rhs(), scope));
        } else if (node instanceof CallTree call) {
            // ignore any variables occuring inside a declassify function
            // This will a) correctly implement the declassify statement and
            // b) also implement a declassify operator usables as expression 
            // to lower the security level.
            // If this is undesirable, one needs to adapt this checkTree method
            // to only return here if inside a statement, e.g. via a boolean parameter.
            if (call.name().name().equals(DECLASSIFY_OPERATOR)) {
                LOGGER.fine("Call: " + call.name().name() + " " + call.name().name().equals(DECLASSIFY_OPERATOR));
                return variables;
            }
            variables.addAll(checkTree(call.name(), scope));
            if (call.params() != null) {
                for (Tree param : call.params()) {
                    variables.addAll(checkTree(param, scope));
                }
            }
        } else if (node instanceof UnaryOperationTree un) {
            variables.addAll(checkTree(un.expr(), scope));
        } else if (node instanceof AssignTree assign) {
            variables.addAll(checkTree(assign.name(), scope));
            variables.addAll(checkTree(assign.expr(), scope));
        } else if (node instanceof BlockTree block) {
            if (block.statements() != null) {
                for (StatementTree stmt : block.statements()) {
                    variables.addAll(checkTree(stmt, scope));
                }
            }
        } else if (node instanceof OldTree old) {
            variables.addAll(checkTree(old.variable(), scope));
        }
        return variables;
    }
}