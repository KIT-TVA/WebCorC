package edu.kit.cbc.common.corc.parsing.parser.ast;

import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;
import java.util.List;

public record CallTree(IdentTree name, List<Tree> params) implements StatementTree {
}
