import { ICompositionStatement } from "../composition-statement";
import { ICondition } from "../../condition/condition";
import { BehaviorSubject } from "rxjs";
import { AbstractStatementNode } from "./abstract-statement-node";
import {
  createEmptyStatementNode,
  statementNodeUtils,
} from "./statement-node-utils";
import { StatementType } from "../abstract-statement";

export class CompositionStatementNode extends AbstractStatementNode {
  public intermediateCondition: BehaviorSubject<ICondition>;
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
    this.intermediateCondition = new BehaviorSubject<ICondition>(statement.intermediateCondition);
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

  override overridePrecondition(condition: BehaviorSubject<ICondition>) {
    super.overridePrecondition(condition);
    this.firstStatementNode?.overridePrecondition(condition);
  }

  override overridePostcondition(condition: BehaviorSubject<ICondition>) {
    this.postcondition = condition;
    this.secondStatementNode?.overridePostcondition(this.postcondition);
  }

  override finalize() {
    super.finalize();
    this.statement.intermediateCondition = this.intermediateCondition.getValue();
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
        (this.precondition.getValue() == child.precondition.getValue() &&
          this.intermediateCondition.getValue() == child.postcondition.getValue()) ||
        child.statement.type == "REPETITION";
      if (!inSync) {
        this.getConditionConflicts(child);
      }
      inSync =
        (this.precondition.getValue() == child.precondition.getValue() &&
          this.intermediateCondition.getValue() == child.postcondition.getValue()) ||
        child.statement.type == "REPETITION";
      return inSync;
    }
    inSync =
      (this.intermediateCondition.getValue() == child.precondition.getValue() &&
        this.postcondition.getValue() == child.postcondition.getValue()) ||
      child.statement.type == "REPETITION";
    if (!inSync) {
      this.getConditionConflicts(child);
    }
    inSync =
      (this.intermediateCondition.getValue() == child.precondition.getValue() &&
        this.postcondition.getValue() == child.postcondition.getValue()) ||
      child.statement.type == "REPETITION";
    return inSync;
  }

  override getConditionConflicts(child: AbstractStatementNode): {
    version1: BehaviorSubject<ICondition>;
    version2: BehaviorSubject<ICondition>;
    type: "PRECONDITION" | "POSTCONDITION";
  }[] {
    const conflicts: {
      version1: BehaviorSubject<ICondition>;
      version2: BehaviorSubject<ICondition>;
      type: string;
    }[] = [];

    // If the child is a repetition, do not report conflicts — keep behavior consistent with
    // the abstract node which ignores repetition nodes for conflict reporting.
    if (child.statement.type == "REPETITION") {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return conflicts;
    }

    if (child == this._firstStatementNode) {
      if (this.precondition.getValue() != child.precondition.getValue()) {
        if (this.precondition.getValue().condition === child.precondition.getValue().condition) {
          child.overridePrecondition(this.precondition);
        } else {
          conflicts.push({
            version1: this.precondition,
            version2: child.precondition,
            type: "PRECONDITION",
          });
        }
      }
      if (this.intermediateCondition.getValue() != child.postcondition.getValue()) {
        if (
          this.intermediateCondition.getValue().condition ===
          child.postcondition.getValue().condition
        ) {
          child.overridePostcondition(this.intermediateCondition);
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
    if (this.intermediateCondition.getValue() != child.precondition.getValue()) {
      if (
        this.intermediateCondition.getValue().condition ===
        child.precondition.getValue().condition
      ) {
        child.overridePrecondition(this.intermediateCondition);
      } else {
        conflicts.push({
          version1: this.intermediateCondition,
          version2: child.precondition,
          type: "PRECONDITION",
        });
      }
    }
    if (this.postcondition.getValue() != child.postcondition.getValue()) {
      if (this.postcondition.getValue().condition === child.postcondition.getValue().condition) {
        child.overridePostcondition(this.postcondition);
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
    const idx = index ?? 0;
    const statementNode = createEmptyStatementNode(statementType, this);
    // Override pre/postconditions for the child depending on which side it will be
    // so that conditions are in sync immediately upon creation.
    if (idx === 0) {
      statementNode.overridePrecondition(this.precondition);
      statementNode.overridePostcondition(this.intermediateCondition);
    } else {
      statementNode.overridePrecondition(this.intermediateCondition);
      statementNode.overridePostcondition(this.postcondition);
    }
    this.addChild(statementNode, idx);
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
