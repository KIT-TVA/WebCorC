package edu.kit.cbc.common.corc.parsing.program.ast;

import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;

public record AssignTree(LValue name, Tree expr) implements StatementTree {
}
