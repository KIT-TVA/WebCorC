package edu.kit.cbc.common.corc.parsing.condition.ast;

public record ExistsTree(IdentTree variable, ConditionTree condition) implements ConditionTree{
}
