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
import edu.kit.cbc.common.corc.parsing.parser.ast.ClassCallTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.LengthTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.parser.ast.UnaryOperationTree;
import edu.kit.cbc.common.corc.parsing.program.ast.AssignTree;
import edu.kit.cbc.common.corc.parsing.program.ast.BlockTree;
import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;
import edu.kit.cbc.projects.files.controller.FilesController;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class SemanticChecker {

    private static final java.util.List<String> IGNORED_VARIABLES = java.util.List.of("true", "false", "null");

    public static void check(Optional<String> projectId, CbCFormula formula, FilesController filesController) throws SemanticException {
        Set<String> foundVariables = SemanticChecker.checkVariables(formula);

        //TODO: Check that Classes used and Method called do exist.
        JavaFileChecker fileChecker = new JavaFileChecker(projectId, filesController);
        Map<String, List<String>> availableClassesAndMethods = fileChecker.checkFiles();

        if (formula.getGlobalConditions() != null) {
            for (Condition condition : formula.getGlobalConditions()) {
                checkCondition(condition, foundVariables, availableClassesAndMethods);
            }
        }

        SemanticChecker.checkStatement(formula.getStatement(), foundVariables, availableClassesAndMethods);
    }

    private static Set<String> checkVariables(CbCFormula formula) throws SemanticException {
        if (formula == null) {
            return new HashSet<>();
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

        return declaredVariables;
    }

    private static void checkStatement(AbstractStatement statement, Set<String> declaredVariables, Map<String, List<String>> availableClassesAndMethods)
            throws SemanticException {
        if (statement == null) {
            return;
        }

        checkCondition(statement.getPreCondition(), declaredVariables, availableClassesAndMethods);
        checkCondition(statement.getPostCondition(), declaredVariables, availableClassesAndMethods);

        switch (statement) {
            case CompositionStatement comp -> {
                checkCondition(comp.getIntermediateCondition(), declaredVariables, availableClassesAndMethods);
                checkStatement(comp.getFirstStatement(), declaredVariables, availableClassesAndMethods);
                checkStatement(comp.getSecondStatement(), declaredVariables, availableClassesAndMethods);
            }
            case SelectionStatement sel -> {
                if (sel.getGuards() != null) {
                    for (Condition guard : sel.getGuards()) {
                        checkCondition(guard, declaredVariables, availableClassesAndMethods);
                    }
                }
                if (sel.getCommands() != null) {
                    for (AbstractStatement cmd : sel.getCommands()) {
                        checkStatement(cmd, declaredVariables, availableClassesAndMethods);
                    }
                }
            }
            case SmallRepetitionStatement rep -> {
                checkCondition(rep.getInvariant(), declaredVariables, availableClassesAndMethods);
                checkCondition(rep.getVariant(), declaredVariables, availableClassesAndMethods);
                checkCondition(rep.getGuard(), declaredVariables, availableClassesAndMethods);
                checkStatement(rep.getLoopStatement(), declaredVariables, availableClassesAndMethods);
            }
            case Statement stmt -> checkTree(stmt.getProgramTree(), declaredVariables, availableClassesAndMethods);
            default -> {
            }
        }
    }

    private static void checkCondition(Condition condition, Set<String> declaredVariables, Map<String, List<String>> availableClassesAndMethods) throws SemanticException {
        if (condition == null) {
            return;
        }
        checkTree(condition.getParsedCondition(), declaredVariables, availableClassesAndMethods);
    }

    private static void checkTree(Tree node, Set<String> scope, Map<String, List<String>> availableClassesAndMethods) throws SemanticException {
        switch (node) {
            case ForAllTree forAll -> {
                Set<String> newScope = new HashSet<>(scope);
                if (forAll.variable() != null) {
                    newScope.add(forAll.variable().name());
                }
                checkTree(forAll.condition(), newScope, availableClassesAndMethods);
            }
            case ExistsTree exists -> {
                Set<String> newScope = new HashSet<>(scope);
                if (exists.variable() != null) {
                    newScope.add(exists.variable().name());
                }
                checkTree(exists.condition(), newScope, availableClassesAndMethods);
            }
            case IdentTree id -> {
                String name = id.name();
                if (!scope.contains(name) && IGNORED_VARIABLES.stream().noneMatch(name::equalsIgnoreCase)) {
                    throw new SemanticException("Variable '" + name + "' is used but not defined.");
                }
            }
            case LengthTree len -> {
                if (!scope.contains(len.variable())) {
                    throw new SemanticException("Variable '" + len.variable() + "' is used but not defined.");
                }
            }
            case ArrayAcessTree arr -> {
                checkTree(arr.name(), scope, availableClassesAndMethods);
                checkTree(arr.expr(), scope, availableClassesAndMethods);
            }
            case BinaryOperationTree bin -> {
                checkTree(bin.lhs(), scope, availableClassesAndMethods);
                checkTree(bin.rhs(), scope, availableClassesAndMethods);
            }
            case CallTree call -> {
                if (call.params() != null) {
                    for (Tree param : call.params()) {
                        checkTree(param, scope, availableClassesAndMethods);
                    }
                }
            }
            case ClassCallTree classCall -> {
                if (classCall.name() != null) {
                    if (availableClassesAndMethods.containsKey(classCall.name().name())) {
                        checkTree(classCall.call(), scope, availableClassesAndMethods);
                    } else {
                        throw new SemanticException("Class '" + classCall.name().name() + "' is used but not defined.");
                    }
                }
            }
            case UnaryOperationTree un -> checkTree(un.expr(), scope, availableClassesAndMethods);
            case AssignTree assign -> {
                checkTree(assign.name(), scope, availableClassesAndMethods);
                checkTree(assign.expr(), scope, availableClassesAndMethods);
            }
            case BlockTree block -> {
                if (block.statements() != null) {
                    for (StatementTree stmt : block.statements()) {
                        checkTree(stmt, scope, availableClassesAndMethods);
                    }
                }
            }
            case OldTree old -> checkTree(old.variable(), scope, availableClassesAndMethods);
            default -> {
            }
        }

    }
}
