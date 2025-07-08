package edu.kit.cbc.common.corc.parsing.parser.ast;

import edu.kit.cbc.common.corc.parsing.lexer.Operator;

public record BinaryOperationTree(Tree lhs, Tree rhs, Operator.OperatorType op)
    implements Tree {
}
