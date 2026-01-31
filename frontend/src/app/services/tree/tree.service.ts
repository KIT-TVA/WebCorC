import { Injectable, signal, Signal, WritableSignal } from "@angular/core";
import { Subject } from "rxjs";
import {
  AbstractStatement,
  IAbstractStatement,
  StatementType,
} from "../../types/statements/abstract-statement";
import { JavaVariable, JavaVariableKind } from "../../types/JavaVariable";
import { Renaming } from "../../types/Renaming";
import { Condition } from "../../types/condition/condition";
import { LocalCBCFormula } from "../../types/CBCFormula";
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
import { RepetitionStatementNode } from "../../types/statements/nodes/repetition-statement-node";

/**
 * Service for the context of the tree in the graphical editor.
 */
@Injectable({
  providedIn: "root",
})
export class TreeService {
  private readonly _verifyNotifier: Subject<void>;
  private readonly _exportNotifier: Subject<void>;
  private readonly _resetVerifyNotifier: Subject<void>;
  private readonly _verificationResultNotifier: Subject<AbstractStatement>;
  private readonly _finalizeNotifier: Subject<void>;
  private _globalConditions: string[] = [];
  private _renames: Renaming[] = [];
  private _statementNodes: WritableSignal<AbstractStatementNode[]> = signal([]);
  private rootStatementNode: RootStatementNode | undefined;
  private _urn = "";

  public constructor() {
    this._verificationResultNotifier = new Subject<AbstractStatement>();
    this._verifyNotifier = new Subject<void>();
    this._exportNotifier = new Subject<void>();
    this._resetVerifyNotifier = new Subject<void>();
    this._finalizeNotifier = new Subject<void>();
  }

  setFormula(newFormula: LocalCBCFormula, urn: string) {
    this._urn = urn;
    this._rootFormula = newFormula;
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

    try {
      this.generateStatementNodes();
    } catch (e) {
      console.error(
        "TreeService.setFormula: failed to initialize statement nodes",
        e,
      );
    }
  }

  private _rootFormula: LocalCBCFormula | undefined;

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

  public get urn() {
    return this._urn;
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

  public get finalizeNotifier() {
    return this._finalizeNotifier;
  }

  public get rootStatement() {
    return this.rootStatementNode;
  }

  public export(): void {
    this._exportNotifier.next();
  }

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

  public removeVariables(names: string[]): void {
    const variablesToBeRemoved: string[] = [];
    names.forEach((name) => {
      const variableName = name.includes(" ")
        ? name.split(" ").slice(1).join(" ")
        : name;
      variablesToBeRemoved.push(variableName);
    });
    this._variables = this._variables.filter(
      (val) => !variablesToBeRemoved.includes(val.name),
    );
  }

  public removeAllVariables(): void {
    this._variables = [];
  }

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

  public getStatementsFromFormula(
    formula: LocalCBCFormula,
  ): IAbstractStatement[] {
    const statements: IAbstractStatement[] = [];
    if (formula && formula.statement) {
      this.collectStatements(formula.statement, statements);
    }
    return statements;
  }

  public refreshNodes(): void {
    this._statementNodes.update((old) => [...old]);
  }

  public addStatementNode(statementNode: AbstractStatementNode) {
    if (this._statementNodes()) {
      this._statementNodes.update((oldNodes) => [...oldNodes, statementNode]);
    } else {
      this._statementNodes.set([statementNode]);
    }
  }

  public createNodeForStatement(
    parent: AbstractStatementNode,
    statementType: StatementType,
    index?: number,
  ): AbstractStatementNode {
    const child = parent.createChild(statementType, index);
    this.addStatementNode(child);
    return child;
  }

  public deleteStatementNode(statementNode: AbstractStatementNode) {
    if (statementNode.statement.type === "ROOT") {
      return;
    }
    if (this._statementNodes().includes(statementNode)) {
      if (statementNode.statement.type === "REPETITION") {
        (statementNode as RepetitionStatementNode).destroy();
      }
      statementNode.parent?.deleteChild(statementNode);
      this._statementNodes.update((old) =>
        old.filter((node) => node != statementNode),
      );
    }
  }

  public generateStatementNodes(): Signal<AbstractStatementNode[]> {
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
      this._rootFormula.statement =
        rootStatementNode.statement as IRootStatement;
    }
    this._statementNodes.set(
      [rootStatementNode].concat(
        this.collectStatementNodeChildren([rootStatementNode]),
      ),
    );
    this.rootStatementNode = rootStatementNode as RootStatementNode;
    return this._statementNodes;
  }

  public addRenaming(type: string, original: string, newName: string): void {
    this._renames.push(new Renaming(type, original, newName));
  }

  public removeRenaming(type: string, original: string, newName: string): void {
    this._renames = this._renames.filter(
      (val) => !val.equal(new Renaming(type, original, newName)),
    );
  }

  private collectStatementNodeChildren(
    parentNodes: (AbstractStatementNode | undefined)[],
  ): AbstractStatementNode[] {
    let childNodes: AbstractStatementNode[] = [];
    for (const parentNode of parentNodes) {
      if (parentNode) {
        childNodes = childNodes
          .concat(parentNode.children.filter((child) => child != undefined) as AbstractStatementNode[])
          .concat(this.collectStatementNodeChildren(parentNode.children));
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

  finalizeStatements() {
    this.rootStatementNode?.finalize();
    if (this.rootFormula) {
      this.rootFormula.javaVariables = this._variables;
      this.rootFormula.renamings = this._renames;
      this.rootFormula.globalConditions = this._globalConditions.map(
        (condition) => new Condition(condition),
      );
    }
    this.finalizeNotifier.next()
  }

  public findStatementNodeById(id: string): AbstractStatementNode | undefined {
    const nodes = this._statementNodes();
    for (const node of nodes) {
      if (node.statement.id === id) {
        return node;
      }
      const found = this.findNodeInSubtree(node, id);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  private findNodeInSubtree(
    node: AbstractStatementNode,
    id: string,
  ): AbstractStatementNode | undefined {
    for (const child of node.children) {
      if (child) {
        if (child.statement.id === id) {
          return child;
        }
        const found = this.findNodeInSubtree(child, id);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  public collectSubtreeNodes(
    node: AbstractStatementNode,
  ): AbstractStatementNode[] {
    const nodes: AbstractStatementNode[] = [node];
    for (const child of node.children) {
      if (child) {
        nodes.push(...this.collectSubtreeNodes(child));
      }
    }
    return nodes;
  }

  public createTempFormulaFromNode(
    node: AbstractStatementNode,
  ): LocalCBCFormula {
    node.finalize();

    let rootStatement: IRootStatement;

    if (node.statement.type === "ROOT") {
      rootStatement = node.statement as IRootStatement;
    } else {
      rootStatement = new RootStatement(
        node.statement.name || "temp",
        node.statement.preCondition,
        node.statement.postCondition,
        node.statement,
      );
    }

    const tempFormula = new LocalCBCFormula(
      node.statement.name || "temp",
      rootStatement,
      this.rootFormula?.javaVariables || [],
      this.rootFormula?.globalConditions || [],
      this.rootFormula?.renamings || null,
      false,
    );

    return tempFormula;
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
