package edu.kit.cbc.common.corc.parsing.parser;

import edu.kit.cbc.common.corc.parsing.ParseException;
import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.condition.ast.ExistsTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.ForAllTree;
import edu.kit.cbc.common.corc.parsing.condition.ast.OldTree;
import edu.kit.cbc.common.corc.parsing.lexer.Identifier;
import edu.kit.cbc.common.corc.parsing.lexer.Keyword;
import edu.kit.cbc.common.corc.parsing.lexer.NumberLiteral;
import edu.kit.cbc.common.corc.parsing.lexer.Operator;
import edu.kit.cbc.common.corc.parsing.lexer.Separator;
import edu.kit.cbc.common.corc.parsing.parser.ast.ArrayAcessTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.BinaryOperationTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.CallTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IdentTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.IntLiteralTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.LengthTree;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.parser.ast.UnaryOperationTree;
import edu.kit.cbc.common.corc.parsing.program.ast.LValue;
import java.util.ArrayList;
import java.util.List;

public abstract class Parser {
    protected final TokenSource tokenSource;

    protected Parser(TokenSource tokenSource) {
        this.tokenSource = tokenSource;
    }

    public Tree parse() {
        return parseStatement();
    }

    protected Tree parseStatement() {
        return parseExpression();
    }

    protected Tree parseExpression() {
        return parseExpressionWithPrecedence(Operator.OperatorType.maxPrecedence());
    }

    protected Tree parseCall() {
        final Identifier predicateName = tokenSource.expectIdentifier();
        tokenSource.expectSeparator(Separator.SeparatorType.PAREN_OPEN);
        List<Tree> params = new ArrayList<>();
        while (tokenSource.hasMore()) {
            if (tokenSource.peek() instanceof Separator(Separator.SeparatorType type, var ignored)
                && type == Separator.SeparatorType.PAREN_CLOSE) {
                break;
            }

            params.add(parseExpression());

            if (tokenSource.peek() instanceof Separator(Separator.SeparatorType type, var ignored)
                && type == Separator.SeparatorType.PAREN_CLOSE) {
                break;
            }

            tokenSource.expectSeparator(Separator.SeparatorType.COMMA);
        }
        tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);

        return new CallTree(new IdentTree(predicateName.identifier()), params);
    }

    protected LValue parseArrayAccess() {
        final Identifier arrayName = this.tokenSource.expectIdentifier();
        this.tokenSource.expectSeparator(Separator.SeparatorType.SQR_PAREN_OPEN);
        Tree expr = parseExpression();
        this.tokenSource.expectSeparator(Separator.SeparatorType.SQR_PAREN_CLOSE);

        return new ArrayAcessTree(new IdentTree(arrayName.identifier()), expr);
    }

    protected Tree parseExpressionWithPrecedence(int precedence) {
        Tree lhs = precedence == 0 ?  parseFactor() : parseExpressionWithPrecedence(precedence - 1);

        while (true) {
            if (this.tokenSource.hasMore() && this.tokenSource.peek() instanceof Operator(Operator.OperatorType type,
                                                                                          var ignored)
                && type.getPrecedence() == precedence) {
                this.tokenSource.consume();
                Tree rhs = precedence == 0 ?  parseFactor() : parseExpressionWithPrecedence(precedence - 1);
                lhs = new BinaryOperationTree(lhs, rhs, type);
            } else {
                return lhs;
            }
        }
    }

    private Tree parseFactor() {
        return switch (this.tokenSource.peek()) {
            case Separator(Separator.SeparatorType type, var ignored) when type == Separator.SeparatorType.PAREN_OPEN -> {
                this.tokenSource.consume();
                Tree conditionTree = parseExpression();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);
                yield conditionTree;
            }
            case Operator(Operator.OperatorType type, var ignored) when type == Operator.OperatorType.MINUS -> {
                this.tokenSource.consume();
                yield new UnaryOperationTree(parseFactor(), Operator.OperatorType.MINUS);
            }
            case Operator(Operator.OperatorType type, var ignored) when type == Operator.OperatorType.NOT -> {
                this.tokenSource.consume();
                yield new UnaryOperationTree(parseFactor(), Operator.OperatorType.NOT);
            }
            case Operator(Operator.OperatorType type, var ignored) when type == Operator.OperatorType.ARITH_NOT -> {
                this.tokenSource.consume();
                yield new UnaryOperationTree(parseFactor(), Operator.OperatorType.ARITH_NOT);
            }
            case Operator(Operator.OperatorType type, var ignored) when type == Operator.OperatorType.OLD -> {
                this.tokenSource.consume();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_OPEN);
                Identifier var = this.tokenSource.expectIdentifier();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);

                yield new OldTree(new IdentTree(var.identifier()));
            }
            case Operator(Operator.OperatorType type, var ignored) when type == Operator.OperatorType.FORALL -> {
                this.tokenSource.consume();
                this.tokenSource.expectKeyword(Keyword.KeywordType.INT);
                final Identifier var = this.tokenSource.expectIdentifier();
                this.tokenSource.expectSeparator(Separator.SeparatorType.SEMICOLON);

                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_OPEN);
                Tree conditionTree = parseExpression();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);

                yield new ForAllTree(new IdentTree(var.identifier()), conditionTree);
            }
            case Operator(Operator.OperatorType type, var ignored) when type == Operator.OperatorType.EXISTS -> {
                this.tokenSource.consume();
                this.tokenSource.expectKeyword(Keyword.KeywordType.INT);
                final Identifier var = this.tokenSource.expectIdentifier();
                this.tokenSource.expectSeparator(Separator.SeparatorType.SEMICOLON);

                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_OPEN);
                Tree conditionTree = parseExpression();
                this.tokenSource.expectSeparator(Separator.SeparatorType.PAREN_CLOSE);

                yield new ExistsTree(new IdentTree(var.identifier()), conditionTree);
            }
            case Identifier ident -> {
                if (this.tokenSource.hasMore(1) && this.tokenSource.peek(1) instanceof Separator(Separator.SeparatorType type, var ignored)) {
                    if (type == Separator.SeparatorType.PAREN_OPEN) {
                        yield this.parseCall();
                    }
                    if (type == Separator.SeparatorType.SQR_PAREN_OPEN) {
                        yield this.parseArrayAccess();
                    }
                    if (type == Separator.SeparatorType.DOT) {
                        //chained call (for example this.doThat())
                        Identifier var = this.tokenSource.expectIdentifier();
                        this.tokenSource.expectSeparator(Separator.SeparatorType.DOT);
                        Identifier secondVar = this.tokenSource.expectIdentifier();

                        if (secondVar.identifier().equals("length")) {
                            yield new LengthTree(var.identifier());
                        } else {
                            yield new IdentTree(var.identifier() + "." + secondVar.identifier());
                        }
                    }
                }
                this.tokenSource.consume();
                yield new IdentTree(ident.identifier());
            }
            case NumberLiteral(String value, var ignored) -> {
                this.tokenSource.consume();
                yield new IntLiteralTree(Integer.parseInt(value));
            }
            default -> throw new ParseException("Unexpected factor: " + this.tokenSource.peek());
        };
    }
}
