import {QbCToken, QbCTokenFactory, TokenCreationResult} from "./qbc-token";
import {FormalParameter} from "../types/formal-parameter";
import {QbCPredicate} from "./qbc-predicate-parser";

export class QbCConstant extends QbCPredicate implements QbCToken, QbCTokenFactory {
  private _name: string;
  private _description: string;

  constructor(name: string, description?: string) {
    super();
    this._name = name;
    this._description = description ? description : "";
  }

  createTokens(input: string, formalParameters: FormalParameter[]): TokenCreationResult[] {
    const matches = input.matchAll(this.matchingRegexp());
    if (!matches) {
      return [];
    }

    const result: TokenCreationResult[] = [];
    for (let match of matches) {
      result.push({token: this, index: match.index!});
    }
    return result;
  }

  getPriority(): number {
    return this._name.length;
  }

  matchingRegexp(): RegExp {
    return new RegExp(this._name, "g");
  }

  isStdToken(): boolean {
    return true;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }
}
