import {FormalParameter} from "../types/formal-parameter";

export const MAX_PRIORITY = Number.MAX_VALUE;

export interface QbCTokenFactory {
  createTokens(input: string, formalParameters: FormalParameter[]): TokenCreationResult[];
  getPriority(): number;
  matchingRegexp(): RegExp;
}

export interface TokenCreationResult {
  token: QbCToken;
  index: number;
}

export interface QbCToken {
  /**
   * A StdToken (see QbCPredicateParser) is a token, that is a valid
   * leaf in the AST. Tokens belonging to an operation are no StdTokens.
   */
  isStdToken(): boolean;
}
