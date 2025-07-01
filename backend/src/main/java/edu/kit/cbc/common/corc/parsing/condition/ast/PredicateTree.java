package edu.kit.cbc.common.corc.parsing.condition.ast;

import java.util.List;

public record PredicateTree(IdentTree name, List<ConditionTree> params) implements ConditionTree{
}
