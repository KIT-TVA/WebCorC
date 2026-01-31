import { AbstractStatementNode } from "./abstract-statement-node";
import { IRepetitionStatement } from "../repetition-statement";
import { BehaviorSubject, combineLatest, Subscription } from "rxjs";
import { Condition, ICondition } from "../../condition/condition";
import {
  createEmptyStatementNode,
  statementNodeUtils,
} from "./statement-node-utils";
import { StatementType } from "../abstract-statement";

export class RepetitionStatementNode extends AbstractStatementNode {
  override statement!: IRepetitionStatement;
  public guard: BehaviorSubject<ICondition>;
  public invariant: BehaviorSubject<ICondition>;
  public variant: BehaviorSubject<ICondition>;

  private conditionSubscription: Subscription;

  constructor(
    statement: IRepetitionStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    this.guard = new BehaviorSubject<ICondition>(statement.guard);
    this.invariant = new BehaviorSubject<ICondition>(statement.invariant);
    this.variant = new BehaviorSubject<ICondition>(statement.variant);

    this.preconditionEditable.next(false);
    this.postconditionEditable.next(false);

    this.conditionSubscription = combineLatest([this.invariant, this.guard]).subscribe(
      ([invariant, guard]) => {
        const conditions = [invariant.condition, guard.condition].filter(c => c && c.trim() !== '');
        const newPrecondition = new Condition(conditions.join(' && '));

        this.precondition.next(newPrecondition);
        this.postcondition.next(invariant);

        if (this.loopStatementNode) {
          this.loopStatementNode.overridePrecondition(this.precondition);
          this.loopStatementNode.overridePostcondition(this.postcondition);
        }
      }
    );

    if (statement.loopStatement) {
      const loopNode = statementNodeUtils(statement.loopStatement, this);
      this.loopStatementNode = loopNode;
    }
  }

  private _loopStatementNode: AbstractStatementNode | undefined;

  public get loopStatementNode() {
    return this._loopStatementNode;
  }

  public set loopStatementNode(loopStatementNode) {
    this.statement.loopStatement = loopStatementNode?.statement;
    this._loopStatementNode = loopStatementNode;
    this.children = [loopStatementNode];
    if (loopStatementNode) {
      loopStatementNode.overridePrecondition(this.precondition);
      loopStatementNode.overridePostcondition(this.postcondition);
    }
  }

  public destroy() {
    this.conditionSubscription.unsubscribe();
  }

  override createChild(
    statementType: StatementType,
    _index?: number,
  ): AbstractStatementNode {
    void _index;
    const statementNode = createEmptyStatementNode(statementType, this);
    this.addChild(statementNode, 0);
    return statementNode;
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
    this.statement.guard = this.guard.getValue();
    this.statement.invariant = this.invariant.getValue();
    this.statement.variant = this.variant.getValue();
  }

  override addChild(statement: AbstractStatementNode, index: number) {
    this.statement.loopStatement = statement.statement;
    this._loopStatementNode = statement;
    this.children = [statement];
    statement.overridePrecondition(this.precondition);
    statement.overridePostcondition(this.postcondition);
  }
}
