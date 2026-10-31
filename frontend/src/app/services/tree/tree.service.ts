import { effect, inject, Injectable, signal, Signal, WritableSignal } from "@angular/core";
import { Subject } from "rxjs";
import { VerifierService } from "../verifier/verifier.service";
import { GlobalSettingsService } from "../global-settings.service";
import {
  AbstractStatement,
  IAbstractStatement,
  IVerifierEntry,
  IVerifiers,
  NodeState,
  nodeStateFor,
  StatementType,
  VerifierResult,
  verifierResultFor,
} from "../../types/statements/abstract-statement";
import { FUNCTIONAL_VERIFIER_ID } from "../../types/Verifier";
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

  private readonly verifierService = inject(VerifierService);
  private readonly globalSettingsService = inject(GlobalSettingsService);

  /**
   * Statement ids passed to {@link markSubtreeUnverified}/{@link markWholeTreeUnverified}
   * while a verification run is in progress. Applied by {@link reapplyRunChanges} once the
   * run's result lands, so an edit made mid-run is not overwritten by a stale result.
   * Session-local to the current run only; cleared by {@link beginRun} and by
   * {@link reapplyRunChanges}.
   */
  private editedDuringRun = new Set<string>();

  public constructor() {
    this._verificationResultNotifier = new Subject<AbstractStatement>();
    this._verifyNotifier = new Subject<void>();
    this._exportNotifier = new Subject<void>();
    this._resetVerifyNotifier = new Subject<void>();
    this._finalizeNotifier = new Subject<void>();

    // A toggle changes the enabled set, a setting change the stamp the entries are compared with.
    this.verifierService.overridesChanged.subscribe(() => this.recomputeAllNodeStates());

    // The verify-mode toggle (Functional vs. All), and the Catalog or overrides arriving after
    // a diagram was loaded, change the enabled-Verifier set `nodeStateFor` derives over without
    // a new run landing — every rendered node's state must react immediately. Read here, not
    // in the recompute, which returns early while no diagram is loaded: the effect would then
    // track nothing but the mode.
    effect(() => {
      this.recomputeAllNodeStates(this.verifierService.effectiveEnabledNonFunctionalVerifierIds);
    });
  }

  /** Called wherever a verification run starts. */
  public beginRun(): void {
    this.editedDuringRun.clear();
  }

  /**
   * Keeps edits made during the run from being overwritten by the result just written onto
   * `statements`: an id edited during the run loses that result again. A setting changed
   * during the run needs nothing here: the result carries the stamp the run started under.
   */
  public reapplyRunChanges(statements: IAbstractStatement[]): void {
    for (const statement of statements) {
      if (this.editedDuringRun.has(statement.id)) {
        TreeService.markUnverified(statement);
      }
    }
    this.editedDuringRun.clear();
  }

  /**
   * Re-derives every node's state from its own entries via {@link nodeStateFor}: after a
   * diagram is loaded, and whenever the enabled-Verifier set the derivation runs over changes
   * (a `disabled` entry for a newly-enabled id now counts, for instance).
   */
  private recomputeAllNodeStates(
    enabledIds: string[] = this.verifierService.effectiveEnabledNonFunctionalVerifierIds,
  ): void {
    if (!this.rootStatementNode) {
      return;
    }
    const subtreeNodes = this.collectSubtreeNodes(this.rootStatementNode);
    for (const node of subtreeNodes) {
      node.statement.nodeState = this.deriveNodeState(node.statement.verifiers, enabledIds);
    }
    this.refreshNodes();
  }

  /** A node's card state from its entries, with a stale Verifier counted as not having run. */
  public deriveNodeState(
    verifiers: IVerifiers | undefined,
    enabledIds: string[] = this.verifierService.effectiveEnabledNonFunctionalVerifierIds,
  ): NodeState {
    return nodeStateFor(this.withStaleAsDisabled(verifiers), enabledIds);
  }

  /**
   * A shallow copy with every stale result marked `disabled`, so the card shows
   * `settings-changed` for it rather than its old green or red.
   */
  private withStaleAsDisabled(verifiers: IVerifiers | undefined): IVerifiers | undefined {
    if (!verifiers) {
      return verifiers;
    }
    const overlaid: IVerifiers = { ...verifiers };
    for (const [id, entry] of Object.entries(verifiers)) {
      if (entry.proven !== undefined && !entry.disabled && this.isStale(id, entry)) {
        overlaid[id] = { ...entry, disabled: true };
      }
    }
    return overlaid;
  }

  /** Equality only; missing equals missing. */
  private isStale(verifierId: string, entry: IVerifierEntry): boolean {
    return (
      verifierId !== FUNCTIONAL_VERIFIER_ID &&
      entry.settingsUpdatedAt !== this.verifierService.settingsStamp(verifierId)
    );
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
    // The saved `nodeState` is not read back; the entries are the source of truth.
    this.recomputeAllNodeStates();
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

  /**
   * An edit invalidates the results of the edited subtree and of the Root (the project
   * result). Ancestors in between keep theirs. The Root's card keeps its state until the
   * next re-derivation; only its entries are cleared.
   */
  public markSubtreeUnverified(node: AbstractStatementNode): void {
    const subtree = this.collectSubtreeNodes(node).map(
      (subtreeNode) => subtreeNode.statement,
    );
    for (const statement of subtree) {
      TreeService.markUnverified(statement);
    }
    const root = this.rootStatementNode?.statement;
    const edited = [...subtree];
    if (root && !subtree.includes(root)) {
      TreeService.clearResults(root);
      edited.push(root);
    }
    if (this.globalSettingsService.isVerifying) {
      for (const statement of edited) {
        this.editedDuringRun.add(statement.id);
      }
    }
    if (this.rootFormula) {
      this.rootFormula.isProven = false;
    }
    this.refreshNodes();
  }

  private static markUnverified(statement: IAbstractStatement): void {
    TreeService.clearResults(statement);
    statement.isProven = false;
    statement.nodeState = "unverified";
  }

  /**
   * Drops `proven`/`status` and the settings stamp from every entry, keeping conditions and
   * `disabled`, so no later {@link nodeStateFor} derivation can bring the old result back.
   */
  private static clearResults(statement: IAbstractStatement): void {
    const kept: IVerifiers = {};
    for (const [verifierId, entry] of Object.entries(statement.verifiers ?? {})) {
      const rest = { ...entry };
      delete rest.proven;
      delete rest.status;
      delete rest.settingsUpdatedAt;
      if (Object.keys(rest).length > 0) {
        kept[verifierId] = rest;
      }
    }
    statement.verifiers = kept;
  }

  public verifierResult(statement: IAbstractStatement, verifierId: string): VerifierResult {
    const entry = statement.verifiers?.[verifierId];
    return verifierResultFor(entry, entry !== undefined && this.isStale(verifierId, entry));
  }

  public markWholeTreeUnverified(): void {
    if (!this.rootStatementNode) {
      return;
    }
    this.markSubtreeUnverified(this.rootStatementNode);
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
