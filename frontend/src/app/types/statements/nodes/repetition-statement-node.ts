import { AbstractStatementNode } from "./abstract-statement-node";
import { IRepetitionStatement } from "../repetition-statement";
import { signal, WritableSignal } from "@angular/core";
import { ICondition } from "../../condition/condition";
import { statementNodeUtils } from "./statement-node-utils";
import { index } from "d3";

export class RepetitionStatementNode extends AbstractStatementNode {
  private _loopStatementNode: AbstractStatementNode | undefined;
  public get loopStatementNode() {
    return this._loopStatementNode;
  }
  public set loopStatementNode(loopStatementNode) {
    this.statement.loopStatement = loopStatementNode?.statement;
    this._loopStatementNode = loopStatementNode;
    this.children = [loopStatementNode];
    if (loopStatementNode) {
      this.overridePostcondition(
        loopStatementNode,
        loopStatementNode.postcondition,
        true,
      );
    }
  }
  override statement!: IRepetitionStatement;
  public guard: WritableSignal<ICondition>;
  public invariant: WritableSignal<ICondition>;
  public variant: WritableSignal<ICondition>;

  constructor(
    statement: IRepetitionStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    this.guard = signal(statement.guard);
    this.invariant = signal(statement.invariant);
    this.variant = signal(statement.variant);
    if (statement.loopStatement) {
      this.loopStatementNode = statementNodeUtils(
        statement.loopStatement,
        this,
      );
      this.children.push(this.loopStatementNode);
      this.loopStatementNode.overridePrecondition(this, this.precondition); //TODO: Compute guard && precondition
      // How its done in Component:
      //       super.precondition.content = "((" + this._invariantCondition.content + ") & (" + this._guardCondition.content + "))"
    }
  }

  public override overridePrecondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ) {
    super.overridePrecondition(sourceNode, condition);
    this.loopStatementNode?.overridePrecondition(this, condition); //TODO: Compute guard && precondition
  }

  public override overridePostcondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
    preserveIfNewConditionEmpty = false,
  ) {
    super.overridePostcondition(sourceNode, condition);
    this.parent?.overridePostcondition(this, condition); //TODO Compute postcondition && ¬guard
  }

  override deleteChild(node: AbstractStatementNode) {
    if (node == this._loopStatementNode) {
      this._loopStatementNode = undefined;
      this.children = [];
    }
  }

  override finalize() {
    super.finalize();
    this.children.forEach((c) => {
      c?.finalize();
    });
    this.statement.guard = this.guard();
    this.statement.invariant = this.invariant();
    this.statement.variant = this.variant();
  }

  override addChild(statement: AbstractStatementNode, index: number) {
    this.statement.loopStatement = statement.statement;
    this._loopStatementNode = statement;
    this.children = [statement];
  }
}
