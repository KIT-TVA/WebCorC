import { ICondition } from "../../condition/condition";
import { WritableSignal } from "@angular/core";
import { AbstractStatementNode } from "./abstract-statement-node";
import { createStatementNode } from "./createStatementNode";
import { IRootStatement } from "../root-statement";

export class RootStatementNode extends AbstractStatementNode {
  override statement!: IRootStatement;
  public childStatementNode: AbstractStatementNode | undefined;

  constructor(
    statement: IRootStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    if (statement.statement) {
      this.childStatementNode = createStatementNode(statement.statement, this);
      this.children.push(this.childStatementNode);
    }
  }

  override overridePrecondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ) {
    super.overridePrecondition(sourceNode, condition);
    this.childStatementNode?.overridePrecondition(this, condition);
  }

  override overridePostcondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ) {
    switch (sourceNode) {
      case this.childStatementNode:
        this.postcondition = condition;
        break;
      default:
      // Should never happen
    }
  }
}
