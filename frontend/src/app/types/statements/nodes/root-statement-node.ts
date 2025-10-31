import { ICondition } from "../../condition/condition";
import { WritableSignal } from "@angular/core";
import { AbstractStatementNode } from "./abstract-statement-node";
import { createStatementNode } from "./createStatementNode";
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
      );
    }
  }

  constructor(
    statement: IRootStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    if (statement.statement) {
      this._childStatementNode = createStatementNode(statement.statement, this);
      this.children.push(this._childStatementNode);
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
  ) {
    switch (sourceNode) {
      case this._childStatementNode:
        this.postcondition = condition;
        break;
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
    this.childStatementNode = statement;
  }
}
