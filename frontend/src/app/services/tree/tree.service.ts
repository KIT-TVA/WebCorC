import { Injectable } from '@angular/core';
import { Refinement } from "../../types/refinement";
import { ReplaySubject, Subject } from "rxjs";
import { VerificationResult } from "../../types/net/verification-net-types";
import { JavaVariable } from './JavaVariable';
import { ConditionDTO } from '../../types/condition/condition';
import { Position } from '../../types/position';

/**
 * Service for the context of the tree in the graphical editor.
 * The context includes the global conditions and the variables
 */
@Injectable({
  providedIn: 'root'
})
export class TreeService {
  private readonly _redrawNotifier: ReplaySubject<void>;
  private readonly _deletionNotifier: ReplaySubject<Refinement>;
  private readonly _verifyNotifier: Subject<void>;

  private _title: string = "";
  private _rootNode: Refinement | undefined;
  private _editorWidth : number = 0;

  private readonly _verificationResultNotifier: Subject<VerificationResult>
  
  private _variables : JavaVariable[] = []
  private _globalConditions : string[] = []
  variablesChangedNotifier: Subject<void> = new Subject<void>();

  constructor() {
    this._redrawNotifier = new ReplaySubject();
    this._deletionNotifier = new ReplaySubject();
    this._verificationResultNotifier = new Subject<VerificationResult>();
    this._verifyNotifier = new Subject<void>();
  }

  public generateCode(language : string, options : any): void {
  }

  public resetPositions() : void {
    this._rootNode?.resetPosition(new Position(this._editorWidth / 2, 0), new Position( -450, 10))
    this._redrawNotifier.next()
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

  /**
   * Redraw the links between the statements on scrolling in the editor
   */
  public onEditorContainerScrolled(): void {
    this._redrawNotifier.next();
  }

  public isRootNode(refinement: Refinement): boolean {
    return refinement.id == 1;
  }

  /**
   * Add a variable to the formula
   * Checks for duplicates
   * @param name the name of the variable
   * @returns true, if added sucessful, else false
   */
  public addVariable(name : string) : boolean {
    const sizeBeforeAdd = this._variables.length;
    const newVariable = new JavaVariable(name);
  
    let isDuplicate : boolean = false
    this._variables.forEach(val => {if (val.equalName(newVariable)){ isDuplicate = true }})

    if (!isDuplicate) {
      this._variables.push(newVariable)
    }

    return this._variables.length != sizeBeforeAdd
  }

  /**
   * Remove a variable by name from the variables of the context
   * @param names 
   */
  public removeVariables(names: string[]) : void {
    const variablesToBeRemoved : string[] = []

    names.forEach(name => variablesToBeRemoved.push(name.split(' ')[1]))

    this._variables = this._variables.filter(val => !variablesToBeRemoved.includes(val.name))
  }

  /**
   * Add a global condition to the context,
   * checks for duplicates
   * @param name the string representation of the condition
   * @returns true, if added else false
   */
  public addGlobalCondition(name : string) : boolean {
    const sizeBeforeAdd = this._globalConditions.length;
    
    let isDuplicate : boolean = false
    this._globalConditions.forEach(val => { if (val == name) { isDuplicate = true }})
    
    if (!isDuplicate) {
      this._globalConditions.push(name)
    }

    return this._globalConditions.length != sizeBeforeAdd
  }

  /**
   * Remove a global condition
   * @param name The string representation of the condition to remove
   */
  public removeGlobalCondition(name : string) : void {
    this._globalConditions = this._globalConditions.filter(val => val !== name)
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

  get redrawNotifier(): ReplaySubject<void> {
    return this._redrawNotifier;
  }

  get variables() : string[] {
    const variablesArray : string[] = []
    this._variables.forEach((javaVariable) => variablesArray.push(javaVariable.toString()))
    return variablesArray;
  }

  get conditions() : ConditionDTO[] {
    const conditionsArray : ConditionDTO[] = []
    this._globalConditions.forEach((condition) => conditionsArray.push(new ConditionDTO(0, "globalCondition", condition)))
    return conditionsArray
  }

  get verificationResultNotifier(): Subject<VerificationResult> {
    return this._verificationResultNotifier;
  }

  get verifyNotifier()  {
    return this._verifyNotifier
  }

  set title(value: string) {
    this._title = value;
  }

  set rootNode(value: Refinement | undefined) {
    this._rootNode = value;
  }

  set editorWidth(editorWidth : number) {
    this._editorWidth = editorWidth
  }
}
