package edu.kit.cbc.common.corc.parsing.condition.ast;

public record ForAllTree(IdentTree variable, ConditionTree condition) implements ConditionTree{
}
