package edu.kit.cbc.common.corc.parsing.parser.ast;

import edu.kit.cbc.common.corc.parsing.program.ast.LValue;

public record ArrayAcessTree(IdentTree name, Tree expr) implements LValue {

}
