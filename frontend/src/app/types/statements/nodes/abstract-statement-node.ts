import { signal, WritableSignal } from "@angular/core";
import { ICondition } from "../../condition/condition";
import { IAbstractStatement } from "../abstract-statement";
import { IPosition } from "../../position";

export class AbstractStatementNode {
  public statement: IAbstractStatement;
  public parent: AbstractStatementNode | undefined;
  public children: (AbstractStatementNode | undefined)[] = [];
  public precondition: WritableSignal<ICondition>;
  public postcondition: WritableSignal<ICondition>;
  public preconditionEditable = signal(true);
  public postconditionEditable = signal(true);

  constructor(
    statement: IAbstractStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    this.statement = statement;
    this.parent = parent;
    this.precondition = signal(statement.preCondition);
    this.postcondition = signal(statement.preCondition);
  }

  public overridePrecondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ): void {
    this.precondition = condition;
  }

  public overridePostcondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ): void {
    this.postcondition = condition;
  }

  public deleteChild(node: AbstractStatementNode) {
    if (this.children.includes(node)) {
      this.children = this.children.filter(
        (filteredNode) => filteredNode != node,
      );
    }
  }

  public setPosition(position: { x: number; y: number }) {
    if ("position" in this.statement) {
      (this.statement.position as IPosition) = {
        xinPx: position.x,
        yinPx: position.y,
      };
    }
  }

  public position(): IPosition {
    if ("position" in this.statement) {
      return this.statement.position as IPosition;
    }
    return {
      xinPx: 0,
      yinPx: 0,
    };
  }
}
