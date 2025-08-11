package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.condition.ast.ExistsTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ForAllTree;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.parser.ast.ArrayAcessTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.BinaryOperationTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.CallTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IntLiteralTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.parser.ast.UnaryOperationTree;
import java.util.List;

public final class ConditionPrinter {
    private final Tree tree;
    private final StringBuilder builder = new StringBuilder();

    private ConditionPrinter(Tree tree) {
        this.tree = tree;
    }

    private void print(String str) {
        this.builder.append(str);
    }

    public static String print(Tree ast) {
        ConditionPrinter printer = new ConditionPrinter(ast);
        printer.printRoot();
        return printer.builder.toString();
    }

    private void printRoot() {
        this.printTree(this.tree);
    }

    private void printTree(Tree tree) {
        switch (tree) {
            case BinaryOperationTree(Tree lhs, Tree rhs, Operator.OperatorType type) -> {
                print("(");
                printTree(lhs);
                print(")");
                space();
                if (type == Operator.OperatorType.EQUAL) {
                    this.builder.append("=");
                } else {
                    this.builder.append(type);
                }
                space();
                print("(");
                printTree(rhs);
                print(")");
            }
            case UnaryOperationTree(Tree lhs, Operator.OperatorType type) -> {
                this.builder.append(type);
                print("(");
                printTree(lhs);
                print(")");
            }
            case ForAllTree(IdentTree name, Tree cond) -> {
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
            case ExistsTree(IdentTree name, Tree cond) -> {
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
            case CallTree(IdentTree name, List<Tree> params) -> {
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
            case ArrayAcessTree(IdentTree name, Tree expr) -> {
                printTree(name);
                print("[");
                printTree(expr);
                print("]");
            }
            default -> throw new IllegalStateException("Unexpected value: " + tree);
        }
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
