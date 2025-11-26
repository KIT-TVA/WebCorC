import { Injectable, signal, Signal, WritableSignal } from "@angular/core";
import { Subject } from "rxjs";
import {
  AbstractStatement,
  IAbstractStatement,
} from "../../types/statements/abstract-statement";
import { JavaVariable, JavaVariableKind } from "../../types/JavaVariable";
import { Renaming } from "../../types/Renaming";
import { Condition } from "../../types/condition/condition";
import { CBCFormula } from "../../types/CBCFormula";
import { ICompositionStatement } from "../../types/statements/composition-statement";
import { IRepetitionStatement } from "../../types/statements/repetition-statement";
import { ISelectionStatement } from "../../types/statements/selection-statement";
import { AbstractStatementNode } from "../../types/statements/nodes/abstract-statement-node";
import { statementNodeUtils } from "../../types/statements/nodes/statement-node-utils";
import {
  IRootStatement,
  RootStatement,
} from "../../types/statements/root-statement";
import { RootStatementNode } from "../../types/statements/nodes/root-statement-node";

/**
 * Service for the context of the tree in the graphical editor.
 * The context includes the global conditions and the variables.
 */
@Injectable({
  providedIn: "root",
})
export class TreeService {
  private readonly _verifyNotifier: Subject<void>;
  private readonly _exportNotifier: Subject<void>;
  private readonly _resetVerifyNotifier: Subject<void>;
  private readonly _verificationResultNotifier: Subject<AbstractStatement>;
  private _globalConditions: string[] = [];
  private _renames: Renaming[] = [];
  private _statementNodes: WritableSignal<AbstractStatementNode[]> = signal([]);
  private rootStatementNode: RootStatementNode | undefined;

  public constructor() {
    this._verificationResultNotifier = new Subject<AbstractStatement>();
    this._verifyNotifier = new Subject<void>();
    this._exportNotifier = new Subject<void>();
    this._resetVerifyNotifier = new Subject<void>();
  }

  setFormula(newFormula: CBCFormula) {
    this._rootFormula = newFormula;
    this.getStatementNodes();
    this._variables = [];
    this._renames = [];
    this._globalConditions = [];
    newFormula.javaVariables.forEach((variable) => {
      this.addVariable(variable.name, variable.kind);
    });
    if (newFormula.renamings) {
      newFormula.renamings.forEach((renaming) => {
        this.addRenaming(renaming.type, renaming.function, renaming.newName);
      });
    }
    newFormula.globalConditions.forEach((condition) => {
      this.addGlobalCondition(condition.condition);
    });
  }

  private _rootFormula: CBCFormula | undefined;

  public get rootFormula() {
    return this._rootFormula;
  }

  private _variables: JavaVariable[] = [];

  public get variables(): string[] {
    const variablesArray: string[] = [];
    this._variables.forEach((javaVariable) =>
      variablesArray.push(javaVariable.toString()),
    );
    return variablesArray;
  }

  public get exportNotifier(): Subject<void> {
    return this._exportNotifier;
  }

  public get conditions(): Condition[] {
    const conditionsArray: Condition[] = [];
    this._globalConditions.forEach((condition) =>
      conditionsArray.push(new Condition(condition)),
    );
    return conditionsArray;
  }

  public get renaming(): Renaming[] {
    const renames: Renaming[] = [];
    this._renames.forEach((rename) =>
      renames.push(new Renaming(rename.type, rename.function, rename.newName)),
    );
    return renames;
  }

  public get verificationResultNotifier() {
    return this._verificationResultNotifier;
  }

  public get verifyNotifier() {
    return this._verifyNotifier;
  }

  public get resetVerifyNotifier() {
    return this._resetVerifyNotifier;
  }

  /**
   * Export the content of the tree service.
   * Including the statements, variables, global conditions and renames.
   */
  public export(): void {
    this._exportNotifier.next();
  }

  /**
   * Add a variable to the formula
   * Checks for duplicates
   * @returns true, if added sucessful, else false
   */
  public addVariable(name: string, kind: JavaVariableKind): boolean {
    const sizeBeforeAdd = this._variables.length;
    const newVariable = new JavaVariable(name, kind);

    let isDuplicate: boolean = false;
    this._variables.forEach((val) => {
      if (val.equalName(newVariable)) {
        isDuplicate = true;
      }
    });

    if (!isDuplicate) {
      this._variables.push(newVariable);
    }

    return this._variables.length != sizeBeforeAdd;
  }

  /**
   * Remove a variable by name from the variables of the context
   * @param names The names of the variables to remove
   */
  public removeVariables(names: string[]): void {
    const variablesToBeRemoved: string[] = [];

    names.forEach((name) => variablesToBeRemoved.push(name.split(" ")[1]));

    this._variables = this._variables.filter(
      (val) => !variablesToBeRemoved.includes(val.name),
    );
  }

  /**
   * Add a global condition to the context,
   * checks for duplicates.
   * @param name the string representation of the condition
   * @returns true, if added else false
   */
  public addGlobalCondition(name: string): boolean {
    const sizeBeforeAdd = this._globalConditions.length;

    let isDuplicate: boolean = false;
    this._globalConditions.forEach((val) => {
      if (val == name) {
        isDuplicate = true;
      }
    });

    if (!isDuplicate) {
      this._globalConditions.push(name);
    }

    return this._globalConditions.length != sizeBeforeAdd;
  }

  /**
   * Remove a global condition
   * @param name The string representation of the condition to remove
   */
  public removeGlobalCondition(name: string): void {
    this._globalConditions = this._globalConditions.filter(
      (val) => val !== name,
    );
  }

  public statements(): IAbstractStatement[] {
    const statements: IAbstractStatement[] = [];
    if (this.rootFormula && this.rootFormula.statement) {
      this.collectStatements(this.rootFormula.statement, statements);
    }
    return statements;
  }

  public addStatementNode(statementNode: AbstractStatementNode) {
    if (this._statementNodes()) {
      this._statementNodes.update((oldNodes) => [...oldNodes, statementNode]);
    } else {
      this._statementNodes.set([statementNode]);
    }
  }

  public deleteStatementNode(statementNode: AbstractStatementNode) {
    if (statementNode.statement.type === "ROOT") {
      return;
    }
    if (this._statementNodes().includes(statementNode)) {
      statementNode.parent?.deleteChild(statementNode);
      this._statementNodes.update((old) =>
        old.filter((node) => node != statementNode),
      );
    }
  }

  public getStatementNodes(): Signal<AbstractStatementNode[]> {
    const rootStatementNode = this.rootFormula?.statement
      ? new RootStatementNode(
          this.rootFormula.statement as RootStatement,
          undefined,
        )
      : statementNodeUtils(
          new RootStatement(
            "",
            new Condition(""),
            new Condition(""),
            undefined,
          ),
        );
    if (this._rootFormula) {
      this._rootFormula.statement = rootStatementNode.statement;
    }
    this._statementNodes.set(
      [rootStatementNode].concat(
        this.collectStatementNodeChildren([rootStatementNode]),
      ),
    );
    this.rootStatementNode = rootStatementNode as RootStatementNode;
    return this._statementNodes;
  }

  /**
   * Add renaming to the tree service
   * @param type The type of the renaming
   * @param original The original name of the renaming
   * @param newName The new name of the renaming
   */
  public addRenaming(type: string, original: string, newName: string): void {
    this._renames.push(new Renaming(type, original, newName));
  }

  /**
   * Remove renaming from the tree service
   * @param type The type of the renaming
   * @param original The original name of the renaming
   * @param newName The new name of the renaming
   */
  public removeRenaming(type: string, original: string, newName: string): void {
    this._renames = this._renames.filter(
      (val) => !val.equal(new Renaming(type, original, newName)),
    );
  }

  private collectStatementNodeChildren(
    nodes: (AbstractStatementNode | undefined)[],
  ): AbstractStatementNode[] {
    let childNodes: AbstractStatementNode[] = [];
    for (const node of nodes) {
      if (node) {
        childNodes = childNodes.concat(
          node.children
            .filter((child) => child != undefined)
            .concat(this.collectStatementNodeChildren(node.children)),
        );
      }
    }
    return childNodes;
  }

  private collectStatements(
    statement: IAbstractStatement | undefined,
    statements: IAbstractStatement[],
  ) {
    if (statement && statements) {
      switch (statement.type) {
        case "STATEMENT":
          statements.push(statement);
          return;
        case "COMPOSITION":
          statements.push(statement);
          this.collectStatements(
            (statement as ICompositionStatement).firstStatement,
            statements,
          );
          this.collectStatements(
            (statement as ICompositionStatement).secondStatement,
            statements,
          );
          return;
        case "REPETITION":
          statements.push(statement);
          this.collectStatements(
            (statement as IRepetitionStatement).loopStatement,
            statements,
          );
          return;
        case "RETURN":
          statements.push(statement);
          return;
        case "SKIP":
          statements.push(statement);
          return;
        case "SELECTION":
          statements.push(statement);
          (statement as ISelectionStatement).commands.forEach((command) =>
            this.collectStatements(command, statements),
          );
          return;
        case "ROOT":
          statements.push(statement);
          this.collectStatements(
            (statement as IRootStatement).statement,
            statements,
          );
      }
    }
  }

  /**
   * Prepares all statements for export by syncing their conditions etc.
   */
  finalizeStatements() {
    this.rootStatementNode?.finalize();
    if (this.rootFormula) {
      this.rootFormula.javaVariables = this._variables;
    }
  }

  public dump() {
    return {
      rootStatementNode: JSON.stringify(
        this.rootStatementNode,
        (key, value) => {
          if (key == "parent") {
            return undefined;
          }
          return value;
        },
      ),
      rootFormula: this.rootFormula,
      statementNodes: JSON.stringify(this._statementNodes(), (key, value) => {
        if (key == "parent") {
          return undefined;
        }
        return value;
      }),
      variables: this._variables,
      globalConditions: this._globalConditions,
      renames: this._renames,
    };
  }
}
