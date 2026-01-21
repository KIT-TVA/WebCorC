import { ICompositionStatement } from "../composition-statement";
import { ICondition } from "../../condition/condition";
import { signal, WritableSignal } from "@angular/core";
import { AbstractStatementNode } from "./abstract-statement-node";
import {
  createEmptyStatementNode,
  statementNodeUtils,
} from "./statement-node-utils";
import { StatementType } from "../abstract-statement";

export class CompositionStatementNode extends AbstractStatementNode {
  public intermediateCondition: WritableSignal<ICondition>;
  override statement!: ICompositionStatement;
  private _firstStatementNode: AbstractStatementNode | undefined;
  private _secondStatementNode: AbstractStatementNode | undefined;

  public get firstStatementNode() {
    return this._firstStatementNode;
  }

  public get secondStatementNode() {
    return this._secondStatementNode;
  }

  public set firstStatementNode(newNode) {
    this.statement.firstStatement = newNode?.statement;
    this._firstStatementNode = newNode;
    this.children = [this._firstStatementNode, this._secondStatementNode];
  }

  public set secondStatementNode(newNode) {
    this.statement.secondStatement = newNode?.statement;
    this._secondStatementNode = newNode;
    this.children = [this._firstStatementNode, this._secondStatementNode];
  }

  constructor(
    statement: ICompositionStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    this.intermediateCondition = signal(statement.intermediateCondition);
    if (statement.firstStatement) {
      this.firstStatementNode = statementNodeUtils(
        statement.firstStatement,
        this,
      );
    }
    if (statement.secondStatement) {
      this.secondStatementNode = statementNodeUtils(
        statement.secondStatement,
        this,
      );
    }
  }

  override overridePrecondition(condition: WritableSignal<ICondition>) {
    super.overridePrecondition(condition);
    this.firstStatementNode?.overridePrecondition(condition);
  }

  override overridePostcondition(condition: WritableSignal<ICondition>) {
    this.postcondition = condition;
    this.secondStatementNode?.overridePostcondition(this.postcondition);
  }

  override finalize() {
    super.finalize();
    this.statement.intermediateCondition = this.intermediateCondition();
    this.firstStatementNode?.finalize();
    this.secondStatementNode?.finalize();
  }

  override deleteChild(node: AbstractStatementNode) {
    switch (node) {
      case this.firstStatementNode:
        this.firstStatementNode = undefined;
        break;
      case this.secondStatementNode:
        this.secondStatementNode = undefined;
        break;
      default:
      // Should never happen
    }
  }

  override checkConditionSync(child: AbstractStatementNode): boolean {
    let inSync;
    if (child == this._firstStatementNode) {
      inSync =
        this.precondition() == child.precondition() &&
        (this.intermediateCondition() == child.postcondition() ||
          child.statement.type == "REPETITION");
      if (!inSync) {
        this.getConditionConflicts(child);
      }
      inSync =
        this.precondition() == child.precondition() &&
        (this.intermediateCondition() == child.postcondition() ||
          child.statement.type == "REPETITION");
      return inSync;
    }
    inSync =
      this.intermediateCondition() == child.precondition() &&
      (this.postcondition() == child.postcondition() ||
        child.statement.type == "REPETITION");
    if (!inSync) {
      this.getConditionConflicts(child);
    }
    inSync =
      this.intermediateCondition() == child.precondition() &&
      (this.postcondition() == child.postcondition() ||
        child.statement.type == "REPETITION");
    return inSync;
  }

  override getConditionConflicts(child: AbstractStatementNode): {
    version1: WritableSignal<ICondition>;
    version2: WritableSignal<ICondition>;
    type: "PRECONDITION" | "POSTCONDITION";
  }[] {
    const conflicts = [];
    if (child == this._firstStatementNode) {
      if (this.precondition() != child.precondition()) {
        if (this.precondition().condition === child.precondition().condition) {
          this.overridePrecondition(child.precondition);
        } else {
          conflicts.push({
            version1: this.precondition,
            version2: child.precondition,
            type: "PRECONDITION",
          });
        }
      }
      if (
        this.intermediateCondition() != child.postcondition() &&
        child.statement.type != "REPETITION"
      ) {
        if (
          this.intermediateCondition().condition ===
          child.postcondition().condition
        ) {
          this.intermediateCondition = child.postcondition;
        } else {
          conflicts.push({
            version1: this.intermediateCondition,
            version2: child.postcondition,
            type: "POSTCONDITION",
          });
        }
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return conflicts;
    }
    if (this.intermediateCondition() != child.precondition()) {
      if (
        this.intermediateCondition().condition ===
        child.precondition().condition
      ) {
        this.intermediateCondition = child.postcondition;
      } else {
        conflicts.push({
          version1: this.intermediateCondition,
          version2: child.precondition,
          type: "PRECONDITION",
        });
      }
    }
    if (
      this.postcondition() != child.postcondition() &&
      child.statement.type != "REPETITION"
    ) {
      if (this.postcondition().condition === child.postcondition().condition) {
        this.overridePostcondition(child.postcondition);
      } else {
        conflicts.push({
          version1: this.postcondition,
          version2: child.postcondition,
          type: "POSTCONDITION",
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return conflicts;
  }

  override createChild(
    statementType: StatementType,
    index?: number,
  ): AbstractStatementNode {
    const statementNode = createEmptyStatementNode(statementType, this);
    this.addChild(statementNode, index ?? 0);
    return statementNode;
  }

  override addChild(statement: AbstractStatementNode, index: number) {
    // Here we don't use the default setter because we don't want to override conditions
    switch (index) {
      case 0:
        this.firstStatementNode = statement;
        break;
      case 1:
        this.secondStatementNode = statement;
    }
  }
}
