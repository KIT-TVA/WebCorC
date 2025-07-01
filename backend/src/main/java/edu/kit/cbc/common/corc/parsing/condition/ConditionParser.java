package edu.kit.cbc.common.corc.parsing.condition;

import edu.kit.cbc.common.corc.parsing.ParseException;
import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.condition.ast.BinaryOperationTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ConditionTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ExistsTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ForAllTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.IntLiteralTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.UnaryOperationTree;
import edu.kit.cbc.common.corc.parsing.lexer.Identifier;
import edu.kit.cbc.common.corc.parsing.lexer.Keyword;
import edu.kit.cbc.common.corc.parsing.lexer.NumberLiteral;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.lexer.Separator;

public final class ConditionParser {
    private final TokenSource tokenSource;

    public ConditionParser(TokenSource tokenSource) {
        this.tokenSource = tokenSource;
    }

    public ConditionTree parseCondition() {
        return parseConditionWithPrecedence(Operator.OperatorType.maxPrecedence());
    }

    private ConditionTree parseConditionWithPrecedence(int precedence) {
        ConditionTree lhs = precedence == 0 ?  parseFactor() : parseConditionWithPrecedence(precedence - 1);

        while(true) {
            if (this.tokenSource.hasMore() && this.tokenSource.peek() instanceof Operator(Operator.OperatorType type)
                && type.getPrecedence() == precedence) {
                this.tokenSource.consume();
                ConditionTree rhs = precedence == 0 ?  parseFactor() : parseConditionWithPrecedence(precedence - 1);
                lhs = new BinaryOperationTree(lhs, rhs, type);
            } else {
                return lhs;
            }
        }
    }

    private ConditionTree parseFactor() {
        return switch(this.tokenSource.peek()) {
            case Separator(Separator.SeparatorType type) when type == Separator.SeparatorType.PAREN_OPEN -> {
                this.tokenSource.consume();
                ConditionTree conditionTree = parseCondition();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);
                yield conditionTree;
            }
            case Operator(Operator.OperatorType type) when type == Operator.OperatorType.MINUS ->
                new UnaryOperationTree(parseFactor(), Operator.OperatorType.MINUS);
            case Operator(Operator.OperatorType type) when type == Operator.OperatorType.NOT ->
                new UnaryOperationTree(parseFactor(), Operator.OperatorType.NOT);
            case Operator(Operator.OperatorType type) when type == Operator.OperatorType.FORALL -> {
                this.tokenSource.consume();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_OPEN);
                this.tokenSource.expectKeyword(Keyword.KeywordType.INT);
                Identifier var = this.tokenSource.expectIdentifier();
                this.tokenSource.expectSeparator(Separator.SeparatorType.SEMICOLON);
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);

                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_OPEN);
                ConditionTree conditionTree = parseCondition();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);

                yield new ForAllTree(new IdentTree(var.identifier()), conditionTree);
            }
            case Operator(Operator.OperatorType type) when type == Operator.OperatorType.EXISTS -> {
                this.tokenSource.consume();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_OPEN);
                this.tokenSource.expectKeyword(Keyword.KeywordType.INT);
                Identifier var = this.tokenSource.expectIdentifier();
                this.tokenSource.expectSeparator(Separator.SeparatorType.SEMICOLON);
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);

                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_OPEN);
                ConditionTree conditionTree = parseCondition();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);

                yield new ExistsTree(new IdentTree(var.identifier()), conditionTree);
            }
            case Identifier ident -> {
                this.tokenSource.consume();
                yield new IdentTree(ident.identifier());
            }
            case NumberLiteral(String value) -> {
                this.tokenSource.consume();
                yield new IntLiteralTree(Integer.parseInt(value));
            }
            default -> throw new ParseException("Unexpected factor: " + this.tokenSource.peek());
        };
    }
}
