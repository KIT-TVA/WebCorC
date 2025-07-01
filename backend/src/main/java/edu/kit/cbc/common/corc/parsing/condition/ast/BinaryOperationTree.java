package edu.kit.cbc.common.corc.parsing.condition.ast;

import edu.kit.cbc.common.corc.parsing.lexer.Operator;

public record BinaryOperationTree(ConditionTree lhs, ConditionTree rhs, Operator.OperatorType op)
    implements ConditionTree {
}
