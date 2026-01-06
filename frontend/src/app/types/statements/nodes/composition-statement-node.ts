import { ICompositionStatement } from "../composition-statement";
import { ICondition } from "../../condition/condition";
import { signal, WritableSignal } from "@angular/core";
import { AbstractStatementNode } from "./abstract-statement-node";
import { statementNodeUtils } from "./statement-node-utils";

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
    if (newNode) {
      this.overridePostcondition(newNode, newNode.postcondition, true);
    }
  }
  public set secondStatementNode(newNode) {
    this.statement.secondStatement = newNode?.statement;
    this._secondStatementNode = newNode;
    this.children = [this._firstStatementNode, this._secondStatementNode];
    if (newNode) {
      this.overridePostcondition(newNode, newNode.postcondition, true);
    }
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
      this.children.push(this.firstStatementNode);
      this.firstStatementNode.overridePrecondition(this, this.precondition);
    }
    if (statement.secondStatement) {
      const secondNode = statementNodeUtils(
        statement.secondStatement,
        this,
      );
      // Store the composition's postcondition from statement data before the setter replaces the signal
      const compositionPostcondition = this.postcondition();
      // Ensure the second statement's postcondition matches the composition's postcondition
      // This is necessary because in a composition, the composition's postcondition should equal the second statement's postcondition
      // If the second statement's postcondition is empty or different, set it to match the composition's
      if (secondNode.postcondition().condition.length < 1 || 
          secondNode.postcondition().condition !== compositionPostcondition.condition) {
        secondNode.postcondition.set(compositionPostcondition);
      }
      this.secondStatementNode = secondNode;
      this.children.push(this.secondStatementNode);
      this.secondStatementNode.overridePrecondition(
        this,
        this.intermediateCondition,
      );
    }
  }

  override overridePrecondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ) {
    super.overridePrecondition(sourceNode, condition);
    this.firstStatementNode?.overridePrecondition(this, condition);
  }

  override overridePostcondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
    preserveIfNewConditionEmpty = false,
  ) {
    let oldCondition: ICondition;
    switch (sourceNode) {
      case this.firstStatementNode:
        oldCondition = this.intermediateCondition();
        this.intermediateCondition = condition;
        break;
      case this.secondStatementNode:
        oldCondition = this.postcondition();
        this.postcondition = condition;
        this.parent?.overridePostcondition(this, condition);
        break;
      default:
        // Should never happen
        return;
    }
    if (preserveIfNewConditionEmpty && condition().condition.length < 1) {
      condition.set(oldCondition);
    }
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
        this.intermediateCondition() == child.postcondition();
      if (!inSync) {
        this.getConditionConflicts(child);
      }
      inSync =
        this.precondition() == child.precondition() &&
        this.intermediateCondition() == child.postcondition();
      return inSync;
    }
    inSync =
      this.intermediateCondition() == child.precondition() &&
      this.postcondition() == child.postcondition();
    if (!inSync) {
      this.getConditionConflicts(child);
    }
    inSync =
      this.intermediateCondition() == child.precondition() &&
      this.postcondition() == child.postcondition();
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
          this.overridePrecondition(child, child.precondition);
        } else {
          conflicts.push({
            version1: this.precondition,
            version2: child.precondition,
            type: "PRECONDITION",
          });
        }
      }
      if (this.intermediateCondition() != child.postcondition()) {
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
    if (this.postcondition() != child.postcondition()) {
      if (this.postcondition().condition === child.postcondition().condition) {
        this.overridePostcondition(child, child.postcondition);
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

  override addChild(statement: AbstractStatementNode, index: number) {
    // Here we don't use the default setter because we don't want to override conditions
    switch (index) {
      case 0:
        this.statement.firstStatement = statement.statement;
        this._firstStatementNode = statement;
        this.children = [this._firstStatementNode, this._secondStatementNode];
        break;
      case 1:
        this.statement.secondStatement = statement.statement;
        this._secondStatementNode = statement;
        this.children = [this._firstStatementNode, this._secondStatementNode];
    }
  }
}
