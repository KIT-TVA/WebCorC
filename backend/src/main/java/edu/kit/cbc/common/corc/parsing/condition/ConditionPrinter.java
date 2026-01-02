package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.parser.ast.BinaryOperationTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.parser.ast.UnaryOperationTree;

public final class ConditionPrinter extends AbstractConditionPrinter {

    private ConditionPrinter(Tree tree) {
        super(tree);
    }

    public static String print(Tree ast) {
        ConditionPrinter printer = new ConditionPrinter(ast);
        printer.printRoot();
        return printer.getResult();
    }

    @Override
    protected void printBinaryOperation(Tree lhs, Tree rhs, Operator.OperatorType type) {
        if (lhs instanceof BinaryOperationTree || lhs instanceof UnaryOperationTree) {
            print("(");
            printTree(lhs);
            print(")");
        } else {
            printTree(lhs);
        }
        space();
        this.builder.append(type);
        space();
        if (rhs instanceof BinaryOperationTree || rhs instanceof UnaryOperationTree) {
            print("(");
            printTree(rhs);
            print(")");
        } else {
            printTree(rhs);
        }
    }

    @Override
    protected void printLength(String variable) {
        print(variable);
        print(".");
        print("length");
    }
}
