import { Injectable } from '@angular/core';
import {Refinement} from "../../types/refinement";
import {ReplaySubject, Subject} from "rxjs";
import {RequestError, VerificationResult} from "../../types/net/verification-net-types";
import {environment} from "../../../environments/environment";
import {Macro} from "../../types/macro";
import { JavaVariable } from './JavaVariable';
import { Condition } from '../../types/condition/condition';

@Injectable({
  providedIn: 'root'
})
export class TreeService {
  private readonly _scrollNotifier: ReplaySubject<void>;
  private readonly _deletionNotifier: ReplaySubject<Refinement>;

  private _title: string = "";
  private _rootNode: Refinement | undefined;
  private readonly _macros: Macro[] = [];

  private readonly _verificationResultNotifier: Subject<VerificationResult>;
  private readonly _variableSizeChangeNotifier: Subject<void>;

  private _variables : JavaVariable[] = [];
  private _globalConditions : string[] = []; 
  variablesChangedNotifier: Subject<void> = new Subject<void>();

  constructor() {
    this._scrollNotifier = new ReplaySubject();
    this._deletionNotifier = new ReplaySubject();
    this._verificationResultNotifier = new Subject<VerificationResult>();
    this._variableSizeChangeNotifier = new Subject();
  }

  public verify(refinement: Refinement): void {
    
  }

  public generateCode(language: string, options: any): void {
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

  public addMacro(macro: Macro): void {
    this._macros.push(macro);
  }

  public removeMacros(): void {
    this._macros.splice(0, this._macros.length);
  }

  public hasMacroWithName(name: string | null): boolean {
    if (!name) {
      return false;
    }

    return this._macros.map(macro => macro.name).includes(name);
  }

  public isRootNode(refinement: Refinement): boolean {
    return refinement.id == 1;
  }

  public addVariable(name : string) : boolean {
    let sizeBeforeAdd = this._variables.length;
    const newVariable = new JavaVariable(name);
  
    let isDuplicate : boolean = false
    this._variables.forEach(val => {if (val.equalName(newVariable)){ isDuplicate = true }})

    if (!isDuplicate) {
      this._variables.push(newVariable)
    }

    return this._variables.length != sizeBeforeAdd
  }

  public removeVariables(names: string[]) : void {
    const variablesToBeRemoved : string[] = []

    names.forEach(name => variablesToBeRemoved.push(name.split(' ')[1]))

    this._variables = this._variables.filter(val => !variablesToBeRemoved.includes(val.name))
  }

  public findVariable(name: string) : string {
    return name
  }

  public addGlobalCondition(name : string) : boolean {
    let sizeBeforeAdd = this._globalConditions.length;
    
    let isDuplicate : boolean = false
    this._globalConditions.forEach(val => { if (val == name) { isDuplicate = true }})
    
    if (!isDuplicate) {
      this._globalConditions.push(name)
    }

    return this._globalConditions.length != sizeBeforeAdd
  }

  public removeGlobalCondition(name : string) : void {
    this._globalConditions = this._globalConditions.filter(val => val !== name)
  } 

  public moveVariableByNameTo(name : string, index : number) {

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

  get variables() : string[] {
    let variablesArray : string[] = []
    this._variables.forEach((javaVariable) => variablesArray.push(javaVariable.toString()))
    return variablesArray;
  }

  get conditions() : Condition[] {
    let conditionsArray : Condition[] = []
    this._globalConditions.forEach((condition) => conditionsArray.push(new Condition(0, "globalCondition", condition)))
    return conditionsArray
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
