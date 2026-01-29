import { AbstractStatementNode } from "./abstract-statement-node";
import { IStatement } from "../simple-statement";
import { signal, WritableSignal } from "@angular/core";
import { Condition, ICondition } from "../../condition/condition";

export class SimpleStatementNode extends AbstractStatementNode {
  override statement!: IStatement;
  public programStatement: WritableSignal<ICondition>;
  constructor(
    statement: IStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    this.programStatement = signal(new Condition(statement.programStatement));
  }

  override finalize() {
    super.finalize();
    this.statement.programStatement = this.programStatement().condition;
  }
}
