package edu.kit.cbc.common.corc.parsing.condition.ast;

import edu.kit.cbc.common.corc.parsing.lexer.Operator;

public record UnaryOperationTree(ConditionTree expr, Operator.OperatorType op) implements ConditionTree {
}
