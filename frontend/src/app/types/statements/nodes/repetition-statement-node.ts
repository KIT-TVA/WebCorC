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

  private dummyEditable = new BehaviorSubject<boolean>(false);

  private internalConditionSubscription: Subscription;
  private childConditionSubscription?: Subscription;
  private editableSubscription: Subscription;

  constructor(
    statement: IRepetitionStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    this.guard = new BehaviorSubject<ICondition>(statement.guard);
    this.invariant = new BehaviorSubject<ICondition>(statement.invariant);
    this.variant = new BehaviorSubject<ICondition>(statement.variant);

    this.editableSubscription = this.dummyEditable.subscribe((newValue) =>
      newValue ? this.dummyEditable.next(false) : undefined,
    );

    this.internalConditionSubscription = combineLatest([
      this.invariant,
      this.guard,
    ]).subscribe(([invariant, guard]) => {
      const conditions = [invariant.condition, guard.condition].filter(
        (c) => c && c.trim() !== "",
      );
      const newPrecondition = new Condition(conditions.join(" && "));
      this.precondition.next(newPrecondition);
      this.postcondition.next(invariant);
    });
    if (statement.loopStatement) {
      this.loopStatementNode = statementNodeUtils(
        statement.loopStatement,
        this,
      );
    }
  }

  private _loopStatementNode: AbstractStatementNode | undefined;

  public get loopStatementNode() {
    return this._loopStatementNode;
  }

  override overridePrecondition(condition: BehaviorSubject<ICondition>) {}

  override overridePostcondition(condition: BehaviorSubject<ICondition>) {}

  override get preconditionEditable() {
    return this.dummyEditable;
  }

  override get postconditionEditable() {
    return this.dummyEditable;
  }

  public set loopStatementNode(loopStatementNode) {
    this.statement.loopStatement = loopStatementNode?.statement;
    this._loopStatementNode = loopStatementNode;
    this.children = loopStatementNode ? [loopStatementNode] : [];

    if (loopStatementNode) {
      loopStatementNode.overridePrecondition(this.precondition);
      loopStatementNode.overridePostcondition(this.postcondition);
      loopStatementNode.postconditionEditable.next(false);
      loopStatementNode.preconditionEditable.next(false);
    }
  }

  public destroy() {
    this.internalConditionSubscription.unsubscribe();
    this.childConditionSubscription?.unsubscribe();
    this.editableSubscription.unsubscribe();
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
    this.loopStatementNode = statement;
  }
}
