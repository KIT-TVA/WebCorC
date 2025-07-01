package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.condition.ast.BinaryOperationTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ConditionTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ExistsTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ForAllTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.IntLiteralTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.PredicateTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.UnaryOperationTree;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import java.util.List;
import java.util.stream.Collectors;

public final class ConditionPrinter {
    private final ConditionTree tree;
    private final StringBuilder builder = new StringBuilder();

    private ConditionPrinter(ConditionTree tree) {
        this.tree = tree;
    }

    public static String print(ConditionTree ast) {
        ConditionPrinter printer = new ConditionPrinter(ast);
        printer.printRoot();
        return printer.builder.toString();
    }

    private void printRoot() {
        this.printTree(this.tree);
    }

    private void printTree(ConditionTree tree) {
        switch (tree) {
            case BinaryOperationTree(ConditionTree lhs, ConditionTree rhs, Operator.OperatorType type) -> {
                print("(");
                printTree(lhs);
                print(")");
                space();
                this.builder.append(type);
                space();
                print("(");
                printTree(rhs);
                print(")");
            }
            case UnaryOperationTree(ConditionTree lhs, Operator.OperatorType type) -> {
                this.builder.append(type);
                print("(");
                printTree(lhs);
                print(")");
            }
            case ForAllTree(IdentTree name, ConditionTree cond) -> {
                print("\\forall");
                space();
                print("(");
                printTree(name);
                print(")");
                space();
                print("(");
                printTree(cond);
                print(")");
            }
            case ExistsTree(IdentTree name, ConditionTree cond) -> {
                print("\\exists");
                space();
                print("(");
                printTree(name);
                print(")");
                space();
                print("(");
                printTree(cond);
                print(")");
            }
            case IdentTree(String identifier) -> {
                print(identifier);
            }
            case IntLiteralTree(int value) -> {
                print(String.valueOf(value));
            }
            case PredicateTree(IdentTree name, List<ConditionTree> params) -> {
                printTree(name);
                print("(");
                for (int i = 0; i < params.size(); i++) {
                    printTree(params.get(i));
                    if (i < params.size() - 1) {
                        print(", ");
                    }
                }
                print(")");
            }
            default -> throw new IllegalStateException("Unexpected value: " + tree);
        }
    }

    private void print(String str) {
        this.builder.append(str);
    }

    private void lineBreak() {
        this.builder.append("\n");
    }

    private void semicolon() {
        this.builder.append(";");
        lineBreak();
    }

    private void space() {
        this.builder.append(" ");
    }
}
