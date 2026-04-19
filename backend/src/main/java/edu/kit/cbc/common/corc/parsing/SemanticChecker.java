package edu.kit.cbc.common.corc.parsing;


import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.CompositionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SelectionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SmallRepetitionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.Statement;
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
import java.util.stream.Collectors;

public class SemanticChecker {

    private static final java.util.List<String> IGNORED_VARIABLES = java.util.List.of("true", "false");

    public static void checkVariables(CbCFormula formula) throws SemanticException {
        if (formula == null) {
            return;
        }

        Set<String> declaredVariables = new HashSet<>();
        if (formula.getJavaVariables() != null) {
            declaredVariables = formula.getJavaVariables().stream()
                    .map(v -> {
                        String name = v.getName().trim();
                        String[] parts = name.split("\\s+");
                        String last = parts[parts.length - 1];
                        return last.replace("[]", "");
                    })
                    .collect(Collectors.toSet());
        }

        if (formula.getGlobalConditions() != null) {
            for (Condition condition : formula.getGlobalConditions()) {
                checkCondition(condition, declaredVariables);
            }
        }

        checkStatement(formula.getStatement(), declaredVariables);
    }

    private static void checkStatement(AbstractStatement statement, Set<String> declaredVariables)
            throws SemanticException {
        if (statement == null) {
            return;
        }

        checkCondition(statement.getPreCondition(), declaredVariables);
        checkCondition(statement.getPostCondition(), declaredVariables);

        if (statement instanceof CompositionStatement comp) {
            checkCondition(comp.getIntermediateCondition(), declaredVariables);
            checkStatement(comp.getFirstStatement(), declaredVariables);
            checkStatement(comp.getSecondStatement(), declaredVariables);
        } else if (statement instanceof SelectionStatement sel) {
            if (sel.getGuards() != null) {
                for (Condition guard : sel.getGuards()) {
                    checkCondition(guard, declaredVariables);
                }
            }
            if (sel.getCommands() != null) {
                for (AbstractStatement cmd : sel.getCommands()) {
                    checkStatement(cmd, declaredVariables);
                }
            }
        } else if (statement instanceof SmallRepetitionStatement rep) {
            checkCondition(rep.getInvariant(), declaredVariables);
            checkCondition(rep.getVariant(), declaredVariables);
            checkCondition(rep.getGuard(), declaredVariables);
            checkStatement(rep.getLoopStatement(), declaredVariables);
        } else if (statement instanceof Statement stmt) {
            checkTree(stmt.getProgramTree(), declaredVariables);
        }
    }

    private static void checkCondition(Condition condition, Set<String> declaredVariables) throws SemanticException {
        if (condition == null) {
            return;
        }
        checkTree(condition.getParsedCondition(), declaredVariables);
    }

    private static void checkTree(Tree node, Set<String> scope) throws SemanticException {
        if (node == null) {
            return;
        }

        if (node instanceof ForAllTree forAll) {
            Set<String> newScope = new HashSet<>(scope);
            if (forAll.variable() != null) {
                newScope.add(forAll.variable().name());
            }
            checkTree(forAll.condition(), newScope);
        } else if (node instanceof ExistsTree exists) {
            Set<String> newScope = new HashSet<>(scope);
            if (exists.variable() != null) {
                newScope.add(exists.variable().name());
            }
            checkTree(exists.condition(), newScope);
        } else if (node instanceof IdentTree id) {
            String name = id.name();
            if (!scope.contains(name) && IGNORED_VARIABLES.stream().noneMatch(name::equalsIgnoreCase)) {
                throw new SemanticException("Variable '" + name + "' is used but not defined.");
            }
        } else if (node instanceof LengthTree len) {
            if (!scope.contains(len.variable())) {
                throw new SemanticException("Variable '" + len.variable() + "' is used but not defined.");
            }
        } else if (node instanceof ArrayAcessTree arr) {
            checkTree(arr.name(), scope);
            checkTree(arr.expr(), scope);
        } else if (node instanceof BinaryOperationTree bin) {
            checkTree(bin.lhs(), scope);
            checkTree(bin.rhs(), scope);
        } else if (node instanceof CallTree call) {
            checkTree(call.name(), scope);
            if (call.params() != null) {
                for (Tree param : call.params()) {
                    checkTree(param, scope);
                }
            }
        } else if (node instanceof UnaryOperationTree un) {
            checkTree(un.expr(), scope);
        } else if (node instanceof AssignTree assign) {
            checkTree(assign.name(), scope);
            checkTree(assign.expr(), scope);
        } else if (node instanceof BlockTree block) {
            if (block.statements() != null) {
                for (StatementTree stmt : block.statements()) {
                    checkTree(stmt, scope);
                }
            }
        } else if (node instanceof OldTree old) {
            checkTree(old.variable(), scope);
        }
    }
}
