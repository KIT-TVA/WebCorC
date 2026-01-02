package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.condition.ast.ExistsTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ForAllTree;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.parser.ast.ArrayAcessTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.BinaryOperationTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.CallTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IntLiteralTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.LengthTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.parser.ast.UnaryOperationTree;
import java.util.List;

public abstract class AbstractConditionPrinter {
    protected final Tree tree;
    protected final StringBuilder builder = new StringBuilder();

    protected AbstractConditionPrinter(Tree tree) {
        this.tree = tree;
    }

    protected void print(String str) {
        this.builder.append(str);
    }

    protected void printRoot() {
        this.printTree(this.tree);
    }

    protected void printTree(Tree tree) {
        switch (tree) {
            case BinaryOperationTree(Tree lhs, Tree rhs, Operator.OperatorType type) -> printBinaryOperation(lhs, rhs, type);
            case LengthTree(String variable) -> printLength(variable);
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

    protected abstract void printBinaryOperation(Tree lhs, Tree rhs, Operator.OperatorType type);

    protected abstract void printLength(String variable);

    protected void space() {
        this.builder.append(" ");
    }

    public String getResult() {
        return builder.toString();
    }
}
