import {QbCToken, QbCTokenFactory, TokenCreationResult} from "./qbc-token";
import {FormalParameter} from "../types/formal-parameter";

/**
 * Terminal symbols including operation symbols and utility (e.g., parenthesis).
 */
export class TerminalSymbol implements QbCToken, QbCTokenFactory {
  public static readonly END_OF_TOKENS = "#";
  public static readonly CROSS_PRODUCT = "⊗";
  public static readonly PARAN_CLOSE = ")";
  public static readonly PARAN_OPEN = "(";
  public static readonly SLASH = "/";
  public static readonly CURLY_CLOSE = "}";
  public static readonly CURLY_OPEN = "{";
  public static readonly POW = "^";
  public static readonly PLUS = "+";
  public static readonly MINUS = "-";

  private _representation: string;

  constructor(representation: string) {
    this._representation = representation;
  }

  get representation(): string {
    return this._representation;
  }

  createTokens(input: string, formalParameters: FormalParameter[]): TokenCreationResult[] {
    const matches = input.matchAll(this.matchingRegexp());
    if (!matches) {
      return [];
    }

    const tokens = [];
    for (let match of matches) {
      tokens.push({token: this, index: match.index!});
    }
    return tokens;
  }

  getPriority(): number {
    return 0;
  }

  matchingRegexp(): RegExp {
    return new RegExp(this.representation.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), "g");
  }

  isStdToken(): boolean {
    return false;
  }
}
