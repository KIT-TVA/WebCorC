package edu.kit.cbc.common.corc.parsing.parser.ast;

import edu.kit.cbc.common.corc.parsing.lexer.Operator;

public record UnaryOperationTree(Tree expr, Operator.OperatorType op) implements Tree {
}
