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
import java.util.Optional;
import java.util.stream.Collectors;

public class SemanticChecker {

    private static final java.util.List<String> IGNORED_VARIABLES = java.util.List.of("true", "false", "null");

    public static void check(Optional<String> projectId, CbCFormula formula, FilesController filesController) throws SemanticException {
        Scope scope = SemanticChecker.checkVariables(formula);

        JavaFileChecker fileChecker = new JavaFileChecker(projectId, filesController);
        scope.merge(fileChecker.checkFiles());

        if (formula.getGlobalConditions() != null) {
            for (Condition condition : formula.getGlobalConditions()) {
                checkCondition(condition, scope);
            }
        }

        SemanticChecker.checkStatement(formula.getStatement(), scope);
    }

    private static Scope checkVariables(CbCFormula formula) {
        if (formula == null) {
            return new Scope();
        }

        Scope scope = new Scope();
        if (formula.getJavaVariables() != null) {
            scope.addAllVariables(
                formula.getJavaVariables().stream()
                    .map(v -> {
                        String name = v.getName().trim();
                        String[] parts = name.split("\\s+");
                        String last = parts[parts.length - 1];
                        return last.replace("[]", "");
                    })
                    .collect(Collectors.toSet())
            );
        }

        return scope;
    }

    private static void checkStatement(AbstractStatement statement, Scope scope)
            throws SemanticException {
        if (statement == null) {
            return;
        }

        checkCondition(statement.getPreCondition(), scope);
        checkCondition(statement.getPostCondition(), scope);

        switch (statement) {
            case CompositionStatement comp -> {
                checkCondition(comp.getIntermediateCondition(), scope);
                checkStatement(comp.getFirstStatement(), scope);
                checkStatement(comp.getSecondStatement(), scope);
            }
            case SelectionStatement sel -> {
                if (sel.getGuards() != null) {
                    for (Condition guard : sel.getGuards()) {
                        checkCondition(guard, scope);
                    }
                }
                if (sel.getCommands() != null) {
                    for (AbstractStatement cmd : sel.getCommands()) {
                        checkStatement(cmd, scope);
                    }
                }
            }
            case SmallRepetitionStatement rep -> {
                checkCondition(rep.getInvariant(), scope);
                checkCondition(rep.getVariant(), scope);
                checkCondition(rep.getGuard(), scope);
                checkStatement(rep.getLoopStatement(), scope);
            }
            case Statement stmt -> checkTree(stmt.getProgramTree(), scope);
            default -> {
            }
        }
    }

    private static void checkCondition(Condition condition, Scope scope) throws SemanticException {
        if (condition == null) {
            return;
        }
        checkTree(condition.getParsedCondition(), scope);
    }

    private static void checkTree(Tree node, Scope scope) throws SemanticException {
        switch (node) {
            case ForAllTree forAll -> {
                Scope newScope = new Scope(scope);
                if (forAll.variable() != null) {
                    newScope.addVariable(forAll.variable().name());
                }
                checkTree(forAll.condition(), newScope);
            }
            case ExistsTree exists -> {
                Scope newScope = new Scope(scope);
                if (exists.variable() != null) {
                    newScope.addVariable(exists.variable().name());
                }
                checkTree(exists.condition(), newScope);
            }
            case IdentTree id -> {
                String name = id.name();
                if (!scope.containsVariable(name) && IGNORED_VARIABLES.stream().noneMatch(name::equalsIgnoreCase)) {
                    throw new SemanticException("Variable '" + name + "' is used but not defined.");
                }
            }
            case LengthTree len -> {
                if (!scope.containsVariable(len.variable())) {
                    throw new SemanticException("Variable '" + len.variable() + "' is used but not defined.");
                }
            }
            case ArrayAcessTree arr -> {
                checkTree(arr.name(), scope);
                checkTree(arr.expr(), scope);
            }
            case BinaryOperationTree bin -> {
                checkTree(bin.lhs(), scope);
                checkTree(bin.rhs(), scope);
            }
            case CallTree call -> {
                if (call.params() != null) {
                    if (scope.containsMethod(call.name().name())) {
                        for (Tree param : call.params()) {
                            //TODO: compare provided argument against the method signature.
                            checkTree(param, scope);
                        }
                    } else {
                        throw new SemanticException("Method '" + call.name().name() + "' is used but not defined.");
                    }

                }
            }
            case ClassCallTree classCall -> {
                if (classCall.name() != null) {
                    if (scope.containsClass(classCall.name().name())) {
                        Scope newScope = new Scope(scope);
                        newScope.filterClasses(classCall.name().name());
                        checkTree(classCall.call(), newScope);
                    } else {
                        throw new SemanticException("Class '" + classCall.name().name() + "' is used but not defined.");
                    }
                }
            }
            case UnaryOperationTree un -> checkTree(un.expr(), scope);
            case AssignTree assign -> {
                checkTree(assign.name(), scope);
                checkTree(assign.expr(), scope);
            }
            case BlockTree block -> {
                if (block.statements() != null) {
                    for (StatementTree stmt : block.statements()) {
                        checkTree(stmt, scope);
                    }
                }
            }
            case OldTree old -> checkTree(old.variable(), scope);
            default -> {
            }
        }

    }
}
