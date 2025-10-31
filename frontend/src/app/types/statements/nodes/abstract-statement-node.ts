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
    this.postcondition = signal(statement.postCondition);
    parent?.overridePostcondition(this, this.postcondition);
  }

  /**
   * Used when the precondition is controlled by the parent, eg. the pre- or intermediate condition of the parent statement.
   * @param sourceNode
   * @param condition
   */
  public overridePrecondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ): void {
    this.precondition = condition;
  }

  /**
   * Used when the postcondition is controlled by the child, probably always the postcondition of the child statement.
   * @param sourceNode must be passed so the correct condition to override can be determined, eg. if the parent has multiple children
   * @param condition
   */
  public overridePostcondition(
    sourceNode: AbstractStatementNode,
    condition: WritableSignal<ICondition>,
  ): void {
    this.postcondition = condition;
  }

  public deleteChild(node: AbstractStatementNode) {
    //EXTEND THIS!
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

  /**
   * Saves the potentially changed pre- and postconditions to the underlying statement.
   */
  public finalize() {
    this.statement.preCondition = this.precondition();
    this.statement.postCondition = this.postcondition();
  }

  public addChild(statement: AbstractStatementNode, index: number) {
    //EXTEND THIS!
  }
}
