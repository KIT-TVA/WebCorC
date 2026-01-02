package edu.kit.cbc.common.corc.parsing.program;

import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.parser.ast.ArrayAcessTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.BinaryOperationTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.CallTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IntLiteralTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.LengthTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.parser.ast.UnaryOperationTree;
import edu.kit.cbc.common.corc.parsing.program.ast.AssignTree;
import edu.kit.cbc.common.corc.parsing.program.ast.BlockTree;
import edu.kit.cbc.common.corc.parsing.program.ast.LValue;
import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;
import java.util.List;

public final class ProgramPrinter {
    private final Tree tree;
    private final StringBuilder builder = new StringBuilder();

    private ProgramPrinter(Tree tree) {
        this.tree = tree;
    }

    private void print(String str) {
        this.builder.append(str);
    }

    public static String print(Tree ast) {
        ProgramPrinter printer = new ProgramPrinter(ast);
        printer.printRoot();
        return printer.builder.toString();
    }

    private void printRoot() {
        this.printTree(this.tree);
    }

    private void printTree(Tree tree) {
        if (tree == null) {
            throw new IllegalArgumentException("tree is null");
        }

        switch (tree) {
            case BinaryOperationTree(Tree lhs, Tree rhs, Operator.OperatorType type) -> {
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
            case UnaryOperationTree(Tree lhs, Operator.OperatorType type) -> {
                this.builder.append(type);
                print("(");
                printTree(lhs);
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
            case AssignTree(LValue left, Tree expr) -> {
                printTree(left);
                print(" = ");
                printTree(expr);
            }
            case BlockTree(List<StatementTree> stmt) -> {
                stmt.forEach(s -> {
                    printTree(s);
                    semicolon();
                });
            }
            case ArrayAcessTree(IdentTree name, Tree expr) -> {
                printTree(name);
                print("[");
                printTree(expr);
                print("]");
            }
            case LengthTree(String variable) -> {
                print(variable);
                print(".");
                print("length");
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
