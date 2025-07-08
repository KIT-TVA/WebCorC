package edu.kit.cbc.common.corc.parsing.condition.ast;

import java.util.List;

public record ArrayAcessTree(IdentTree name, ConditionTree expr) implements ConditionTree{

}
