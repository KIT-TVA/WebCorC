import { ICondition } from "../../condition/condition";
import { BehaviorSubject } from "rxjs";
import { AbstractStatementNode } from "./abstract-statement-node";
import {
  createEmptyStatementNode,
  statementNodeUtils,
} from "./statement-node-utils";
import { IRootStatement } from "../root-statement";
import { StatementType } from "../abstract-statement";

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
  }

  override createChild(
    statementType: StatementType,
    index?: number,
  ): AbstractStatementNode {
    const statementNode = createEmptyStatementNode(statementType, this);
    statementNode.overridePrecondition(this.precondition);
    statementNode.overridePostcondition(this.postcondition);
    this.addChild(statementNode, 0);
    return statementNode;
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

  override overridePrecondition(condition: BehaviorSubject<ICondition>) {
    super.overridePrecondition(condition);
    this._childStatementNode?.overridePrecondition(condition);
  }

  override overridePostcondition(condition: BehaviorSubject<ICondition>) {
    super.overridePostcondition(condition);
    this._childStatementNode?.overridePostcondition(condition);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override addChild(statement: AbstractStatementNode, index: number) {
    this._childStatementNode = statement;
    this.statement.statement = statement.statement;
    this.children = [statement];
  }
}
