import { AbstractStatementNode } from "./abstract-statement-node";
import { IStatement } from "../simple-statement";

export class SimpleStatementNode extends AbstractStatementNode {
  override statement!: IStatement;
  constructor(
    statement: IStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
  }
}
