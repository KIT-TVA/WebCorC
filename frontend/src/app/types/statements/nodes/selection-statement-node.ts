import { AbstractStatementNode } from "./abstract-statement-node";
import { ISelectionStatement } from "../selection-statement";
import { signal, WritableSignal } from "@angular/core";
import { Condition, ICondition } from "../../condition/condition";
import { statementNodeUtils } from "./statement-node-utils";

export class SelectionStatementNode extends AbstractStatementNode {
  public guards: WritableSignal<ICondition>[];
  override statement!: ISelectionStatement;

  constructor(
    statement: ISelectionStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    this.guards = statement.guards.map((g) => signal(g));
    this.children = statement.commands.map((c) =>
      c ? statementNodeUtils(c, this) : undefined,
    );
  }

  override overridePrecondition(condition: WritableSignal<ICondition>) {
    super.overridePrecondition(condition);
    this.children.forEach((c, index) => {
      if (c && this.guards[index]) {
        const computedCondition = signal(
          new Condition(
            condition().condition + " & " + this.guards[index]().condition,
          ),
        );
        c.overridePrecondition(computedCondition);
      }
    });
  }

  override deleteChild(node: AbstractStatementNode) {
    const index = this.children.findIndex((child) => child == node);
    this.children[index] = undefined;
    this.statement.commands[index] = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override overridePostcondition(condition: WritableSignal<ICondition>) {
    super.overridePostcondition(condition);
    //TODO check if we are deleting the postcondition of a statement with a different postcondition than this statement
    this.children.forEach((child) => child?.overridePostcondition(condition));
  }

  override finalize() {
    super.finalize();
    this.children.forEach((c) => {
      c?.finalize();
    });
    this.statement.guards = [];
    this.guards.forEach((g) => {
      this.statement.guards.push(g());
    });
  }

  addSelection() {
    const condition = signal(new Condition(""));
    this.guards.push(condition);
    this.children.push(undefined);
    this.statement.guards.push(condition());
    this.statement.commands.push(undefined);
  }

  setSelection(index: number, node: AbstractStatementNode) {
    if (index < this.children.length) {
      this.children[index] = node;
      this.statement.commands[index] = node.statement;
    }
  }

  override checkConditionSync(_child: AbstractStatementNode): boolean {
    return true;
  }

  removeSelection() {
    this.guards.pop();
    this.children.pop();
    this.statement.guards.pop();
    this.statement.commands.pop();
  }

  override addChild(statement: AbstractStatementNode, index: number) {
    this.setSelection(index, statement);
  }
}
