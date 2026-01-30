package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import java.util.Map;

public class JMLConditionPrinter extends AbstractConditionPrinter {

    private static final Map<Operator.OperatorType, String> REPLACE = Map.of(
        Operator.OperatorType.EQUAL, "=",
        Operator.OperatorType.IMPLICATION, "->",
        Operator.OperatorType.LOGICAL_AND, "&",
        Operator.OperatorType.LOGICAL_OR, "|"
    );

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
        printTree(lhs);
        space();
        if (REPLACE.containsKey(type)) {
            this.builder.append(REPLACE.get(type));
        } else {
            this.builder.append(type);
        }
        space();
        printTree(rhs);
    }

    @Override
    protected void printLength(String variable) {
        print("length(");
        print(variable);
        print(")");
    }
}
