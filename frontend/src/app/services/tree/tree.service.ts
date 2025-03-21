import { Injectable } from '@angular/core';
import { Refinement } from "../../types/refinement";
import { ReplaySubject, Subject } from "rxjs";
import { JavaVariable } from './JavaVariable';
import { ConditionDTO } from '../../types/condition/condition';
import { Position } from '../../types/position';
import { Statement } from '../../types/statements/statement';
import { Renaming } from './Renaming';

/**
 * Service for the context of the tree in the graphical editor.
 * The context includes the global conditions and the variables.
 */
@Injectable({
  providedIn: 'root'
})
export class TreeService {
  private readonly _redrawNotifier: ReplaySubject<void>;
  private readonly _deletionNotifier: ReplaySubject<Refinement>;
  private readonly _verifyNotifier: Subject<void>;
  private readonly _exportNotifier: Subject<void>;
  private readonly _resetVerifyNotifier : Subject<void>;

  private _title: string = "";
  private _rootNode: Refinement | undefined;
  private _editorWidth : number = 0;

  private readonly _verificationResultNotifier: Subject<Statement>
  
  private _variables : JavaVariable[] = []
  private _globalConditions : string[] = []
  private _renames : Renaming[] = []

  public constructor() {
    this._redrawNotifier = new ReplaySubject();
    this._deletionNotifier = new ReplaySubject();
    this._verificationResultNotifier = new Subject<Statement>();
    this._verifyNotifier = new Subject<void>();
    this._exportNotifier = new Subject<void>();
    this._resetVerifyNotifier = new Subject<void>();
  }

  public resetPositions() : void {
    this._rootNode?.resetPosition(new Position(this._editorWidth / 2, 0), new Position( -450, 10))
    this._redrawNotifier.next()
  }

  /**
   * Export the content of the tree service.
   * Including the statements, variables, global conditions and renames.
   */
  public export(): void {
    this._exportNotifier.next()
  }


  /**
   * Redraw the links between the statements on scrolling in the editor.
   */
  public onEditorContainerScrolled(): void {
    this._redrawNotifier.next();
  }

  /**
   * Check for given refinement if the statement is the root node 
   * @param refinement The refinement to check for root node attributes
   * @returns true, if refinement is root node else false
   */
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
   * @param names The names of the variables to remove
   */
  public removeVariables(names: string[]) : void {
    const variablesToBeRemoved : string[] = []

    names.forEach(name => variablesToBeRemoved.push(name.split(' ')[1]))

    this._variables = this._variables.filter(val => !variablesToBeRemoved.includes(val.name))
  }

  /**
   * Add a global condition to the context,
   * checks for duplicates.
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

  /**
   * Add renaming to the tree service
   * @param type The type of the renaming
   * @param original The original name of the renaming
   * @param newName The new name of the renaming
   */
  public addRenaming(type : string, original : string, newName : string) : void {
    this._renames.push(new Renaming(type, original, newName))
  }

  /**
   * Remove renaming from the tree service
   * @param type The type of the renaming
   * @param original The original name of the renaming
   * @param newName The new name of the renaming
   */
  public removeRenaming(type : string, original : string, newName : string) : void {
    this._renames = this._renames.filter(val => !val.equal(new Renaming(type, original, newName)))
  }

  
  public get deletionNotifier(): ReplaySubject<Refinement> {
    return this._deletionNotifier;
  }

  public get exportNotifier() : Subject<void> {
    return this._exportNotifier
  }

  public get title(): string {
    return this._title;
  }

  public get rootNode(): Refinement | undefined {
    return this._rootNode;
  }

  public get redrawNotifier(): ReplaySubject<void> {
    return this._redrawNotifier;
  }

  public get variables() : string[] {
    const variablesArray : string[] = []
    this._variables.forEach((javaVariable) => variablesArray.push(javaVariable.toString()))
    return variablesArray;
  }

  public get conditions() : ConditionDTO[] {
    const conditionsArray : ConditionDTO[] = []
    this._globalConditions.forEach((condition) => conditionsArray.push(new ConditionDTO(0, "globalCondition", condition)))
    return conditionsArray
  }

  public get renaming() : Renaming[] {
    const renames : Renaming[] = []
    this._renames.forEach((rename) => renames.push(new Renaming(rename.type, rename.function, rename.newName)))
    return renames
  }

  public get verificationResultNotifier() {
    return this._verificationResultNotifier;
  }

  public get verifyNotifier()  {
    return this._verifyNotifier
  }

  public get resetVerifyNotifier() {
    return this._resetVerifyNotifier
  }

  public set title(value: string) {
    this._title = value;
  }

  public set rootNode(value: Refinement | undefined) {
    this._rootNode = value;
  }

  public set editorWidth(editorWidth : number) {
    this._editorWidth = editorWidth
  }
}
