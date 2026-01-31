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

  private internalConditionSubscription: Subscription;
  private childConditionSubscription?: Subscription;

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

    this.internalConditionSubscription = combineLatest([this.invariant, this.guard]).subscribe(
      ([invariant, guard]) => {
        const conditions = [invariant.condition, guard.condition].filter(c => c && c.trim() !== '');
        const newPrecondition = new Condition(conditions.join(' && '));
        this.precondition.next(newPrecondition);
        this.postcondition.next(invariant);
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

  public set loopStatementNode(loopStatementNode: AbstractStatementNode | undefined) {
    // Clean up any existing subscriptions to a previous child
    this.childConditionSubscription?.unsubscribe();

    this.statement.loopStatement = loopStatementNode?.statement;
    this._loopStatementNode = loopStatementNode;
    this.children = loopStatementNode ? [loopStatementNode] : [];

    if (loopStatementNode) {
      // The child's conditions are now read-only
      loopStatementNode.preconditionEditable.next(false);
      loopStatementNode.postconditionEditable.next(false);

      // Create new subscriptions to pipe this node's conditions to the child
      const preSub = this.precondition.subscribe(val => loopStatementNode.precondition.next(val));
      const postSub = this.postcondition.subscribe(val => loopStatementNode.postcondition.next(val));
      
      this.childConditionSubscription = new Subscription(() => {
        preSub.unsubscribe();
        postSub.unsubscribe();
      });
    }
  }

  public destroy() {
    this.internalConditionSubscription.unsubscribe();
    this.childConditionSubscription?.unsubscribe();
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
      this.loopStatementNode = undefined;
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
    this.loopStatementNode = statement;
  }
}
