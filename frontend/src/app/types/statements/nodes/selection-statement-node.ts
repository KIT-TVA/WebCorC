import { AbstractStatementNode } from "./abstract-statement-node";
import { ISelectionStatement } from "../selection-statement";
import { signal, Signal, WritableSignal } from "@angular/core";
import { Condition, ICondition } from "../../condition/condition";
import { statementNodeUtils } from "./statement-node-utils";
import { index } from "d3";

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

  override overridePrecondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ) {
    super.overridePrecondition(sourceNode, condition);
    this.children.forEach((c) => {
      if (c) {
        c.overridePrecondition(this, condition); //TODO condition && guard
      }
    });
  }

  override deleteChild(node: AbstractStatementNode) {
    const index = this.children.findIndex((child) => child == node);
    this.children[index] = undefined;
    this.statement.commands[index] = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override overridePostcondition(
    sourceNode: AbstractStatementNode,
    condition: Signal<ICondition>,
  ) {
    //TODO or all postconditions ??
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
      if (node) {
        this.overridePostcondition(node, node.postcondition);
      }
    }
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
