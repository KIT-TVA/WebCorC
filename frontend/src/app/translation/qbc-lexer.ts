import {QbCToken, QbCTokenFactory, TokenCreationResult} from "./qbc-token";
import {FormalParameter} from "../types/formal-parameter";
import {Type} from "@angular/core";
import {TerminalSymbol} from "./terminal-symbols";

export class QbCLexer {
  private readonly _tokenFactories: QbCTokenFactory[];
  private readonly _formalParameters: FormalParameter[];

  constructor(tokenFactories: QbCTokenFactory[], formalParameters: FormalParameter[]) {
    this._tokenFactories = tokenFactories;
    this._tokenFactories.sort((a, b) => b.getPriority()-a.getPriority());
    this._formalParameters = formalParameters;
  }

  public lex(input: string): QbCLexingResult {
    const tokens: TokenCreationResult[] = [];
    this._tokenFactories.forEach(tokenType => {
      tokens.push(...tokenType.createTokens(input, this._formalParameters));
      input = this.maskInput(input, tokenType.matchingRegexp());
    });
    tokens.sort((a, b) => a.index-b.index);
    return new QbCLexingResult(tokens.map(result => result.token));
  }

  private maskInput(input: string, regexp: RegExp): string {
    const matches= input.matchAll(regexp);
    for (let match of matches) {
      input = input.substring(0, match.index!) + this.createMask(match.length) + input.substring(match.index!+match.length);
    }
    return input;
  }

  private createMask(length: number): string {
    let s = "";
    for (let i = 0; i < length; i++) {
      s += '?';
    }
    return s;
  }
}

export class QbCLexingResult {
  private readonly _tokens: QbCToken[];
  private consumeCounter = 0;

  constructor(tokens: QbCToken[]) {
    this._tokens = tokens;
  }

  public consume(): QbCToken {
    return this._tokens[this.consumeCounter++];
  }

  public expectType(type: Type<QbCToken>): void {
    if (this.current() instanceof type) {
      this.consume();
    } else {
      throw Error("Unexpected type " + typeof this.current() + ", expected: " + type);
    }
  }

  public expect(representation: string | string[]): void {
    if (this.isTerminal(representation)) {
      this.consume();
    } else {
      console.log(this.current());
      throw Error("Unexpected type, expected " + representation);
    }
  }

  public current(): QbCToken {
    if (this.consumeCounter >= this._tokens.length) {
      return new TerminalSymbol(TerminalSymbol.END_OF_TOKENS);
    }
    return this._tokens[this.consumeCounter];
  }

  public isStdToken(): boolean {
    return this.current().isStdToken();
  }

  public isTerminal(representation: string | string[]): boolean {
    if (!(this.current() instanceof TerminalSymbol)) {
      return false;
    }

    if (typeof representation === "string") {
      return (this.current() as TerminalSymbol).representation === representation;
    } else {
      return representation.includes((this.current() as TerminalSymbol).representation);
    }
  }

  get tokens(): QbCToken[] {
    return this._tokens;
  }
}
