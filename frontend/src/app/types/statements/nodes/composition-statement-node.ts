import { ICompositionStatement } from "../composition-statement";
import { ICondition } from "../../condition/condition";
import { signal, WritableSignal } from "@angular/core";
import { AbstractStatementNode } from "./abstract-statement-node";
import { createStatementNode } from "./createStatementNode";

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
      this.firstStatementNode = createStatementNode(
        statement.firstStatement,
        this,
      );
      this.children.push(this.firstStatementNode);
      this.firstStatementNode.overridePrecondition(this, this.precondition);
    }
    if (statement.secondStatement) {
      this.secondStatementNode = createStatementNode(
        statement.secondStatement,
        this,
      );
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
  ) {
    switch (sourceNode) {
      case this.firstStatementNode:
        this.intermediateCondition = condition;
        break;
      case this.secondStatementNode:
        this.postcondition = condition;
        break;
      default:
      // Should never happen
    }
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
}
