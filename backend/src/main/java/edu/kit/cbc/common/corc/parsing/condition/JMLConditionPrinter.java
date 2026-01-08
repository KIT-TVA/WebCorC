package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;

public class JMLConditionPrinter extends AbstractConditionPrinter {

    private JMLConditionPrinter(Tree tree) {
        super(tree);
    }

    public static String print(Tree ast) {
        JMLConditionPrinter printer = new JMLConditionPrinter(ast);
        printer.printRoot();
        return printer.getResult();
    }

    @Override
    protected void printBinaryOperation(Tree lhs, Tree rhs, Operator.OperatorType type) {
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

    @Override
    protected void printLength(String variable) {
        print("length(");
        print(variable);
        print(")");
    }
}
