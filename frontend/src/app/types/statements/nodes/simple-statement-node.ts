import { AbstractStatementNode } from "./abstract-statement-node";
import { IStatement } from "../simple-statement";
import { BehaviorSubject } from "rxjs";
import { Condition, ICondition } from "../../condition/condition";

export class SimpleStatementNode extends AbstractStatementNode {
  override statement!: IStatement;
  public programStatement: BehaviorSubject<ICondition>;
  constructor(
    statement: IStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    this.programStatement = new BehaviorSubject<ICondition>(new Condition(statement.programStatement));
  }

  override finalize() {
    super.finalize();
    this.statement.programStatement = this.programStatement.getValue().condition;
  }
}
