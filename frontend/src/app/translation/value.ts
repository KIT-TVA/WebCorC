import {FormalParameter} from "../types/formal-parameter";
import {QbCToken, QbCTokenFactory, TokenCreationResult} from "./qbc-token";
import {QbCPredicate} from "./qbc-predicate-parser";

export class Value extends QbCPredicate implements QbCToken {
  private readonly _value: number;

  constructor(value: number) {
    super();
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  isStdToken(): boolean {
    return true;
  }
}

export class ValueTokenFactory implements QbCTokenFactory {
  createTokens(input: string, formalParameters: FormalParameter[]): TokenCreationResult[] {
    const matches = input.matchAll(this.matchingRegexp());
    if (!matches) {
      return [];
    }

    const tokens: TokenCreationResult[] = [];
    for (let match of matches) {
      tokens.push({token: new Value(Number(match["0"])), index: match.index!});
    }
    return tokens;
  }

  getPriority(): number {
    return 0;
  }

  matchingRegexp(): RegExp {
    return new RegExp(/[0-9]+/, "g");
  }
}
