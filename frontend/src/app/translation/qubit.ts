import {QbCPredicate} from "./qbc-predicate-parser";
import {MAX_PRIORITY, QbCToken, QbCTokenFactory, TokenCreationResult} from "./qbc-token";
import {FormalParameter} from "../types/formal-parameter";

export class Qubit extends QbCPredicate implements QbCToken {
  private _name: string;
  private _notation: "bra" | "ket";

  constructor(name: string, notation: "bra" | "ket" = "ket") {
    super();
    this._name = name;
    this._notation = notation;
  }

  isStdToken(): boolean {
    return true;
  }
}

export class QubitTokenFactory implements QbCTokenFactory {
  createTokens(input: string, formalParameters: FormalParameter[]): TokenCreationResult[] {
    const matches = input.matchAll(this.matchingRegexp());
    if (!matches) {
      return [];
    }

    const qubits: TokenCreationResult[] = [];
    for (let match of matches) {
      // match["1"] is undefined, if the qubit is bra-denoted
      if (match["1"]) {
        qubits.push({token: new Qubit(match["1"], "ket"), index: match.index!});
      } else {
        qubits.push({token: new Qubit(match["2"], "bra"), index: match.index!});
      }
    }
    return qubits;
  }

  getPriority(): number {
    return MAX_PRIORITY;
  }

  matchingRegexp(): RegExp {
    return new RegExp("\\|([A-z0-9])>|<([A-z0-9])\\|", "g");
  }
}
