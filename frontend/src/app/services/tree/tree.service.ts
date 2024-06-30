import { Injectable } from '@angular/core';
import {Refinement} from "../../types/refinement";
import {ReplaySubject, Subject} from "rxjs";
import {FormalParameter} from "../../types/formal-parameter";
import {QbCConstant} from "../../translation/constants";
import {QbCTokenFactory} from "../../translation/qbc-token";
import {ValueTokenFactory} from "../../translation/value";
import {TerminalSymbol} from "../../translation/terminal-symbols";
import {QubitTokenFactory} from "../../translation/qubit";
import {RequestError, VerificationResult} from "../../types/net/verification-net-types";
import {environment} from "../../../environments/environment";
import {QbCVariable} from "../../translation/variables";
import {Macro} from "../../types/macro";

@Injectable({
  providedIn: 'root'
})
export class TreeService {
  private readonly _scrollNotifier: ReplaySubject<void>;
  private readonly _deletionNotifier: ReplaySubject<Refinement>;

  private _title: string = "";
  private _rootNode: Refinement | undefined;
  private readonly _formalParameters: FormalParameter[] = [];
  private readonly _macros: Macro[] = [];
  private readonly _tokenFactories: QbCTokenFactory[] = [
    new QbCConstant("H", "Hadamard"),
    new QbCConstant("X", "NOT/Pauli-X"),
    new QbCConstant("Y", "Pauli-Y"),
    new QbCConstant("Z", "Pauli-Z"),
    new QbCConstant("I", "Identity"),
    new QbCConstant("S", "Phase"),
    new QbCConstant("T", "pi/8"),
    new QbCConstant("CNOT", "Controlled NOT"),
    new QbCConstant("SWAP", "Swap"),
    new QubitTokenFactory(),
    new ValueTokenFactory(),
    new TerminalSymbol(TerminalSymbol.END_OF_TOKENS),
    new TerminalSymbol(TerminalSymbol.PARAN_OPEN),
    new TerminalSymbol(TerminalSymbol.PARAN_CLOSE),
    new TerminalSymbol(TerminalSymbol.CROSS_PRODUCT),
    new TerminalSymbol(TerminalSymbol.PLUS),
    new TerminalSymbol(TerminalSymbol.MINUS),
    new TerminalSymbol(TerminalSymbol.SLASH),
    new TerminalSymbol(TerminalSymbol.POW),
    new TerminalSymbol(TerminalSymbol.CURLY_OPEN),
    new TerminalSymbol(TerminalSymbol.CURLY_CLOSE),
  ];

  private readonly _verificationResultNotifier: Subject<VerificationResult>;
  private readonly _variableSizeChangeNotifier: Subject<void>;

  private _variables: QbCVariable[] = [];
  variablesChangedNotifier: Subject<void> = new Subject<void>();

  constructor() {
    this._scrollNotifier = new ReplaySubject();
    this._deletionNotifier = new ReplaySubject();
    this._verificationResultNotifier = new Subject<VerificationResult>();
    this._variableSizeChangeNotifier = new Subject();
  }

  public verify(refinement: Refinement): Promise<VerificationResult | RequestError> {
    return fetch(environment.apiUrl + "/verify", {
      method: "POST",
      body: JSON.stringify({
        rootRefinement: refinement.export(),
        formalParameters: this.formalParameters.map(fp => fp.export()),
        variables: this._variables.map(variable => variable.export()),
        macros: this._macros.map(macro => macro.export())
      }),
      headers: [
        ["Content-Type", "application/json"]
      ]
    }).catch(err => err)
      .then(res => res.json()).then((verificationResult: VerificationResult) => {
      this.verificationResultNotifier.next(verificationResult);
      return verificationResult;
    });
  }

  public generateCode(language: string, options: any): void {
    if (!this.rootNode) {
      return;
    }

    fetch(environment.apiUrl + "/codegen", {
      method: "POST",
      body: JSON.stringify({
        language,
        rootRefinement: this.rootNode.export(),
        formalParameters: this.formalParameters.map(fp => fp.export()),
        variables: this._variables.map(v => v.export()),
        macros: this._macros.map(macro => macro.export()),
        options
      }),
      headers: [
        ["Content-Type", "application/json"]
      ]
    }).then(resp => resp.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        if (language === "qiskit") {
          a.download = "program.py";
        } else {
          a.download = "prog";
        }
        a.click();
      }).catch(err => console.log(err));
  }

  public downloadJSON(): void {
    if (!this.rootNode) {
      return;
    }

    const structure = JSON.stringify(this.rootNode?.export(), null, 2);
    const blob = new Blob([structure], {type: "application/json"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "program.json";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  public onEditorContainerScrolled(): void {
    this._scrollNotifier.next();
  }

  public addFormalParameter(parameter: FormalParameter): void {
    this._formalParameters.push(parameter);
  }

  public removeFormalParameter(parameter: FormalParameter): void {
    this._formalParameters.splice(this._formalParameters.indexOf(parameter), 1);
  }

  public addMacro(macro: Macro): void {
    this._macros.push(macro);
  }

  public removeMacros(): void {
    this._macros.splice(0, this._macros.length);
  }

  public hasFormalParameterWithName(name: string | null): boolean {
    if (!name) {
      return false;
    }

    return this._formalParameters.map(fp => fp.name).includes(name);
  }

  public removeFormalParameters(): void {
    this._formalParameters.splice(0, this._formalParameters.length);
  }

  public hasMacroWithName(name: string | null): boolean {
    if (!name) {
      return false;
    }

    return this._macros.map(macro => macro.name).includes(name);
  }

  public isRootNode(refinement: Refinement): boolean {
    return this.rootNode === refinement;
  }

  public addVariable(name: string): void {
    const existingVariable = this._variables.find(variable => variable.name === name);
    if (existingVariable) {
      existingVariable.indicateUsage();
    } else {
      this._variables.push(new QbCVariable(name));
    }
  }

  public removeVariables(names: string[]): void {
    this._variables = this._variables.filter(variable => {
      if (names.includes(variable.name)) {
        return !variable.removeUsage();
      } else {
        return true;
      }
    });
  }

  public findVariable(varName: string): QbCVariable {
    return this._variables.filter(v => v.name === varName)[0];
  }

  public moveVariable(variable: QbCVariable, up: boolean): void {
    const idxVar = this._variables.indexOf(variable);
    // up refers to a move closer to 0
    if (up) {
      if (idxVar !== 0) {
        const otherVar = this._variables[idxVar-1];
        this._variables.splice(idxVar-1, 1, variable);
        this._variables.splice(idxVar, 1, otherVar);
      }
    } else {
      if (idxVar !== this._variables.length-1) {
        const otherVar = this._variables[idxVar+1];
        this._variables[idxVar+1] = variable;
        this._variables[idxVar] = otherVar;
      }
    }
    this.variablesChangedNotifier.next();
  }

  get variables(): QbCVariable[] {
    return this._variables;
  }

  public moveVariableByNameTo(varName: string, idx: number): void {
    const variable = this._variables.find(v => v.name===varName);
    if (!variable) {
      return;
    }
    const curIdx = this._variables.indexOf(variable);
    for (let i=0; i<Math.abs(idx-curIdx); i++) {
      this.moveVariable(variable, idx < curIdx);
    }
  }

  public changedVariableSize(): void {
    this.variableSizeChangeNotifier.next();
  }

  get deletionNotifier(): ReplaySubject<Refinement> {
    return this._deletionNotifier;
  }

  get title(): string {
    return this._title;
  }

  get rootNode(): Refinement | undefined {
    return this._rootNode;
  }

  get scrollNotifier(): ReplaySubject<void> {
    return this._scrollNotifier;
  }

  get formalParameters(): FormalParameter[] {
    return this._formalParameters;
  }

  get macros(): Macro[] {
    return this._macros;
  }

  get tokenFactories(): QbCTokenFactory[] {
    return this._tokenFactories;
  }

  get verificationResultNotifier(): Subject<VerificationResult> {
    return this._verificationResultNotifier;
  }

  get variableSizeChangeNotifier(): Subject<void> {
    return this._variableSizeChangeNotifier;
  }

  set title(value: string) {
    this._title = value;
  }

  set rootNode(value: Refinement | undefined) {
    this._rootNode = value;
  }
}
