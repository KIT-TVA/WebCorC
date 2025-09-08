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

public class JMLConditionPrinter {
    private final Tree tree;
    private final StringBuilder builder = new StringBuilder();

    private JMLConditionPrinter(Tree tree) {
        this.tree = tree;
    }

    private void print(String str) {
        this.builder.append(str);
    }

    public static String print(Tree ast) {
        JMLConditionPrinter printer = new JMLConditionPrinter(ast);
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
            default -> ConditionPrinter.print(tree);
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
