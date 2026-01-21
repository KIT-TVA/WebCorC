import { AbstractStatementNode } from "./abstract-statement-node";
import { IRepetitionStatement } from "../repetition-statement";
import { signal, WritableSignal } from "@angular/core";
import { Condition, ICondition } from "../../condition/condition";
import {
  createEmptyStatementNode,
  statementNodeUtils,
} from "./statement-node-utils";
import { StatementType } from "../abstract-statement";

export class RepetitionStatementNode extends AbstractStatementNode {
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
      // Store the repetition's postcondition before the setter potentially overrides it
      const repetitionPostcondition = this.postcondition();
      const loopNode = statementNodeUtils(statement.loopStatement, this);
      // Only override the repetition's postcondition if the loop statement's postcondition is empty
      // Otherwise, preserve the repetition's postcondition from the statement data
      if (loopNode.postcondition().condition.length < 1) {
        loopNode.postcondition.set(repetitionPostcondition);
      }
      this.loopStatementNode = loopNode;
      const computedCondition = signal(
        new Condition(
          this.invariant().condition + " & " + this.guard().condition,
        ),
      );
      this.loopStatementNode.overridePrecondition(computedCondition); //TODO: Compute guard && precondition
      // After the setter, if the repetition's postcondition was overridden incorrectly, restore it
      if (
        this.postcondition().condition !== repetitionPostcondition.condition &&
        repetitionPostcondition.condition.length > 0
      ) {
        this.postcondition.set(repetitionPostcondition);
      }
      // How its done in Component:
      //       super.precondition.content = "((" + this._invariantCondition.content + ") & (" + this._guardCondition.content + "))"
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
  }

  override checkConditionSync(child: AbstractStatementNode) {
    let inSync = this.postcondition() == child.postcondition();
    if (!inSync) {
      this.getConditionConflicts(child);
    }
    inSync = this.postcondition() == child.postcondition();
    return inSync;
  }

  /*
  Suppressed warning because the precondition of a repetition statement,
  is solely determined by its invariant "anded" with its guard
 */
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override overridePrecondition(condition: WritableSignal<ICondition>) {
    this.precondition.set(
      new Condition(
        this.invariant().condition + " & " + this.guard().condition,
      ),
    );
    this.loopStatementNode?.overridePrecondition(this.precondition);
  }
  /*
  Suppressed warning because the postcondition of a repetition statement,
  is solely determined by its invariant
   */
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override overridePostcondition(condition: WritableSignal<ICondition>) {
    this.postcondition = this.invariant;
    this.loopStatementNode?.overridePrecondition(this.postcondition);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override createChild(
    statementType: StatementType,
    _index?: number,
  ): AbstractStatementNode {
    void _index;
    const statementNode = createEmptyStatementNode(statementType, this);
    // For repetition, the loop's precondition is (invariant & guard) and its postcondition is the invariant
    const loopPre = signal(
      new Condition(
        this.invariant().condition + " & " + this.guard().condition,
      ),
    );
    statementNode.overridePrecondition(loopPre);
    statementNode.overridePostcondition(this.invariant);
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
    this.statement.guard = this.guard();
    this.statement.invariant = this.invariant();
    this.statement.variant = this.variant();
  }

  /*
  Suppressed because there is only one child in a repetition statement
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override addChild(statement: AbstractStatementNode, index: number) {
    this.statement.loopStatement = statement.statement;
    this._loopStatementNode = statement;
    this.children = [statement];
  }
}
