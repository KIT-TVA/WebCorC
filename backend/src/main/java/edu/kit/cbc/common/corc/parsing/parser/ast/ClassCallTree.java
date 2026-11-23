package edu.kit.cbc.common.corc.parsing.parser.ast;

import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;
import java.util.List;

public record ClassCallTree(IdentTree name, CallTree call) implements StatementTree {
}
