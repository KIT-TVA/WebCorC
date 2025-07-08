package edu.kit.cbc.common.corc.parsing.condition.ast;

import edu.kit.cbc.common.corc.parsing.parser.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;

public record ExistsTree(IdentTree variable, Tree condition) implements Tree {
}
