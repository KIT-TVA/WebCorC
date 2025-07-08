package edu.kit.cbc.common.corc.parsing.program.ast;

import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import java.util.List;

public record BlockTree(List<StatementTree> statements) implements Tree {
}
