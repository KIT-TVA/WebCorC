import { ICondition } from "../../condition/condition";
import { WritableSignal } from "@angular/core";
import { AbstractStatementNode } from "./abstract-statement-node";
import { statementNodeUtils } from "./statement-node-utils";
import { IRootStatement } from "../root-statement";
import { index } from "d3";

export class RootStatementNode extends AbstractStatementNode {
  override statement!: IRootStatement;

  private _childStatementNode: AbstractStatementNode | undefined;

  public get childStatementNode() {
    return this._childStatementNode;
  }

  set childStatementNode(_childStatementNode) {
    this._childStatementNode = _childStatementNode;
    this.statement.statement = _childStatementNode?.statement;
    this.children = [_childStatementNode];
    if (_childStatementNode) {
      this.overridePostcondition(
        _childStatementNode,
        _childStatementNode.postcondition,
        true,
      );
    }
  }

  constructor(
    statement: IRootStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    if (statement.statement) {
      this.childStatementNode = statementNodeUtils(statement.statement, this);
    }
  }

  override overridePrecondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ) {
    super.overridePrecondition(sourceNode, condition);
    this._childStatementNode?.overridePrecondition(this, condition);
  }

  override overridePostcondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
    preserveIfNewConditionEmpty = false,
  ) {
    switch (sourceNode) {
      case this._childStatementNode: {
        const oldCondition = this.postcondition();
        this.postcondition = condition;
        if (preserveIfNewConditionEmpty && condition().condition.length < 1) {
          this.postcondition.set(oldCondition);
        }
        break;
      }
      default:
      // Should never happen
    }
  }

  override finalize() {
    super.finalize();
    this._childStatementNode?.finalize();
  }

  override deleteChild(node: AbstractStatementNode) {
    super.deleteChild(node);
    this._childStatementNode = undefined;
    this.statement.statement = undefined;
  }

  override addChild(statement: AbstractStatementNode, index: number) {
    this._childStatementNode = statement;
    this.statement.statement = statement.statement;
    this.children = [statement];
  }
}
