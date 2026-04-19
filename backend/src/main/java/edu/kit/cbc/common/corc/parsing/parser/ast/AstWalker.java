package edu.kit.cbc.common.corc.parsing.parser.ast;

import edu.kit.cbc.common.corc.parsing.condition.ast.ExistsTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ForAllTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.OldTree;
import edu.kit.cbc.common.corc.parsing.program.ast.AssignTree;
import edu.kit.cbc.common.corc.parsing.program.ast.BlockTree;
import edu.kit.cbc.common.corc.parsing.program.ast.StatementTree;

import java.util.function.Consumer;

/**
 * A utility class to walk the entire Abstract Syntax Tree (AST).
 * It visits a node and then recursively visits its children, applying the
 * specified action.
 */
public class AstWalker {

    /**
     * Walks the given AST node and all its children recursively,
     * applying the provided action to each node.
     * The traversal is done pre-order (parent is processed before its children).
     *
     * @param node   the root node to start walking from (can be null)
     * @param action the arbitrary function to apply to each node
     */
    public static void walk(Tree node, Consumer<Tree> action) {
        if (node == null) {
            return;
        }

        action.accept(node);

        if (node instanceof ArrayAcessTree arr) {
            walk(arr.name(), action);
            walk(arr.expr(), action);
        } else if (node instanceof BinaryOperationTree bin) {
            walk(bin.lhs(), action);
            walk(bin.rhs(), action);
        } else if (node instanceof CallTree call) {
            walk(call.name(), action);
            if (call.params() != null) {
                for (Tree param : call.params()) {
                    walk(param, action);
                }
            }
        } else if (node instanceof UnaryOperationTree un) {
            walk(un.expr(), action);
        } else if (node instanceof AssignTree assign) {
            walk(assign.name(), action);
            walk(assign.expr(), action);
        } else if (node instanceof BlockTree block) {
            if (block.statements() != null) {
                for (StatementTree stmt : block.statements()) {
                    walk(stmt, action);
                }
            }
        } else if (node instanceof ExistsTree exists) {
            walk(exists.variable(), action);
            walk(exists.condition(), action);
        } else if (node instanceof ForAllTree forAll) {
            walk(forAll.variable(), action);
            walk(forAll.condition(), action);
        } else if (node instanceof OldTree old) {
            walk(old.variable(), action);
        }
    }
}
