import {QbCLexingResult} from "./qbc-lexer";
import {TerminalSymbol} from "./terminal-symbols";
import {Matrix} from "./matrix";

/**
 * Parser for the QbC Predicate Grammar (QbCPG):
 *
 * Predicate  -> CrossProd PList
 * PList      -> + CrossProd PList        {+}
 *             | - CrossProd PList        {-}
 *             | ε                        {#,),}}
 *
 * CrossProd  -> Op CPList
 * CPList     -> ⊗ Op CPList              {⊗}
 *             | ε                        {#,),},+,-,}
 *
 * Op         -> Pow MList
 * MList      -> Pow MList                {StdToken,(}
 *             | / Pow MList              {/}
 *             | ε                        {#,),},+,-,⊗}
 *
 * Pow        -> Factor PowList
 * PowList    -> ^{ Predicate } PowList   {^}
 *             | ε                        {#,),},+,-,⊗,StdToken,(,/}
 *
 * Factor     -> StdToken                 {StdToken}
 *             | ( Predicate )            {(}
 *
 * where StdToken denotes a structured token (variable, value, qubits, but not operations).
 * Whitespaces aren't part of the syntax and must be ignored.
 * QbCPG is an SLL(1) grammar and parsed with a recursive descent parsing algorithm.
 *
 * The derived syntactic categories are:
 * Predicate = PlusOp | MinusOp | CrossProd | Pow | MultOp | DivOp | StdToken
 * StdToken = Constant | Qubit | Val
 * PlusOp, MinusOp, CrossProd, Pow, MultOp, DivOp :: Predicate Predicate
 */
export class QbCPredicateParser {
  private readonly lexingResult: QbCLexingResult;

  constructor(lexingResult: QbCLexingResult) {
    this.lexingResult = lexingResult;
  }

  public parsePredicate(): QbCPredicate {
    const cp = this.parseCrossProd();
    return this.parsePList(cp);
  }

  private parsePList(left: QbCPredicate): QbCPredicate {
    if (this.lexingResult.isTerminal(TerminalSymbol.PLUS)) {
      this.lexingResult.consume();
      const op = new PlusOp(left, this.parseCrossProd());
      return this.parsePList(op);
    } else if (this.lexingResult.isTerminal(TerminalSymbol.MINUS)) {
      this.lexingResult.consume();
      const op = new MinusOp(left, this.parseCrossProd());
      return this.parsePList(op);
    } else if (this.lexingResult.isTerminal([
        TerminalSymbol.END_OF_TOKENS,
        TerminalSymbol.PARAN_CLOSE,
        TerminalSymbol.CURLY_CLOSE])) {
      return left;
    } else {
      throw Error("Expected [+,-,#,)] but got " + this.lexingResult.current());
    }
  }

  private parseCrossProd(): QbCPredicate {
    const op = this.parseOp();
    return this.parseCPList(op);
  }

  private parseCPList(left: QbCPredicate): QbCPredicate {
    if (this.lexingResult.isTerminal(TerminalSymbol.CROSS_PRODUCT)) {
      this.lexingResult.consume();
      const op = new CrossProdOp(left, this.parseOp());
      return this.parseCPList(op);
    } else if (this.lexingResult.isTerminal([
      TerminalSymbol.END_OF_TOKENS,
        TerminalSymbol.PARAN_CLOSE,
        TerminalSymbol.CURLY_CLOSE,
        TerminalSymbol.PLUS,
        TerminalSymbol.MINUS])) {
      return left;
    } else {
      throw Error("Invalid token for CPList: " + this.lexingResult.current());
    }
  }

  private parseOp(): QbCPredicate {
    const pow = this.parsePow();
    return this.parseMList(pow);
  }

  private parseMList(left: QbCPredicate): QbCPredicate {
    if (this.lexingResult.isStdToken() ||
        this.lexingResult.isTerminal(TerminalSymbol.PARAN_OPEN)) {
      const op = new MultOp(left, this.parsePow());
      return this.parseMList(op);
    } else if (this.lexingResult.isTerminal(TerminalSymbol.SLASH)) {
      this.lexingResult.consume();
      const op = new DivOp(left, this.parsePow());
      return this.parseMList(op);
    } else if (this.lexingResult.isTerminal([
        TerminalSymbol.END_OF_TOKENS,
        TerminalSymbol.PARAN_CLOSE,
        TerminalSymbol.CURLY_CLOSE,
        TerminalSymbol.PLUS,
        TerminalSymbol.MINUS,
        TerminalSymbol.CROSS_PRODUCT])) {
      return left;
    } else {
      throw Error("Invalid token for MList: " + this.lexingResult.current());
    }
  }

  private parsePow(): QbCPredicate {
    const factor = this.parseFactor();
    return this.parsePowList(factor);
  }

  private parsePowList(left: QbCPredicate): QbCPredicate {
    if (this.lexingResult.isTerminal(TerminalSymbol.POW)) {
      this.lexingResult.consume();
      this.lexingResult.expect(TerminalSymbol.CURLY_OPEN);
      const op = new PowOp(left, this.parsePredicate());
      this.lexingResult.expect(TerminalSymbol.CURLY_CLOSE);
      return this.parsePowList(op);
    } else if (this.lexingResult.isTerminal([
        TerminalSymbol.END_OF_TOKENS,
        TerminalSymbol.PARAN_CLOSE,
        TerminalSymbol.CURLY_CLOSE,
        TerminalSymbol.PLUS,
        TerminalSymbol.MINUS,
        TerminalSymbol.CROSS_PRODUCT,
        TerminalSymbol.PARAN_OPEN,
        TerminalSymbol.SLASH]) || this.lexingResult.isStdToken()) {
      return left;
    } else {
      throw Error("Invalid token for PowList: " + this.lexingResult.current());
    }
  }

  private parseFactor(): QbCPredicate {
    if (this.lexingResult.isTerminal(TerminalSymbol.PARAN_OPEN)) {
      this.lexingResult.consume();
      const pred = this.parsePredicate();
      this.lexingResult.expect(TerminalSymbol.PARAN_CLOSE);
      return pred;
    } else if (this.lexingResult.isStdToken()) {
      return this.lexingResult.consume();
    } else {
      throw Error("Expected '(' or StdToken but got " + this.lexingResult.current());
    }
  }
}

/**
 * Every Predicate is a positive semi-definitive matrix.
 */
export abstract class QbCPredicate extends Matrix {
}

/**
 * A Bi Operation is a link of two operands, e.g. a Plus operation.
 * BiOperations build QbCPredicates as nodes of the AST.
 * Since a BiOperation itself is not a matrix, matrix operations on BiOperation objects regard the BiOperations result.
 */
export class BiOperation extends QbCPredicate {
  private left: QbCPredicate;
  private right: QbCPredicate;

  constructor(left: QbCPredicate, right: QbCPredicate) {
    super();
    this.left = left;
    this.right = right;
  }
}

export class PlusOp extends BiOperation {}
export class MinusOp extends BiOperation {}
export class CrossProdOp extends BiOperation {}
export class PowOp extends BiOperation {}
export class MultOp extends BiOperation {}
export class DivOp extends BiOperation {}
