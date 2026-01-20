import { signal, WritableSignal } from "@angular/core";
import { ICondition } from "../../condition/condition";
import { IAbstractStatement, StatementType } from "../abstract-statement";
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
    console.log("abstract constructor");
    parent?.overridePostcondition(this.postcondition);
  }

  /**
   * Used when the precondition is controlled by the parent, eg. the pre- or intermediate condition of the parent statement.
   * @param condition
   */
  public overridePrecondition(condition: WritableSignal<ICondition>): void {
    this.precondition = condition;
  }

  /**
   * Used when the postcondition is controlled by the child, probably always the postcondition of the child statement.
   * @param condition
   */
  public overridePostcondition(condition: WritableSignal<ICondition>): void {
    this.postcondition = condition;
  }

  public deleteChild(node: AbstractStatementNode) {
    //EXTEND THIS!
    if (this.children.includes(node)) {
      this.children = this.children.filter(
        (filteredNode) => filteredNode != node,
      );
    }
    //TODO: Check this is still necessary after refactor
    this.overridePrecondition(signal(this.precondition()));
    this.overridePostcondition(signal(this.postcondition()));
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

  public checkConditionSync(child: AbstractStatementNode) {
    let inSync =
      this.precondition() == child.precondition() &&
      (this.postcondition() == child.postcondition() ||
        child.statement.type == "REPETITION");
    if (!inSync) {
      this.getConditionConflicts(child);
    }
    inSync =
      this.precondition() == child.precondition() &&
      (this.postcondition() == child.postcondition() ||
        child.statement.type == "REPETITION");
    return inSync;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addChild(statement: AbstractStatementNode, index: number) {
    //EXTEND THIS!
    throw Error(
      "AbstractStatementNode does not support child statement nodes.",
    );
  }

  getConditionConflicts(child: AbstractStatementNode): {
    version1: WritableSignal<ICondition>;
    version2: WritableSignal<ICondition>;
    type: "PRECONDITION" | "POSTCONDITION";
  }[] {
    const conflicts = [];
    if (this.precondition() != child.precondition()) {
      if (this.precondition().condition === child.precondition().condition) {
        this.overridePrecondition(child.precondition);
      } else {
        conflicts.push({
          version1: this.precondition,
          version2: child.precondition,
          type: "PRECONDITION",
        });
      }
    }
    if (
      this.postcondition() != child.postcondition() &&
      child.statement.type != "REPETITION"
    ) {
      if (this.postcondition().condition === child.postcondition().condition) {
        this.overridePostcondition(child.postcondition);
      } else {
        conflicts.push({
          version1: this.postcondition,
          version2: child.postcondition,
          type: "POSTCONDITION",
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return conflicts;
  }

  createChild(
    statementType: StatementType,
    index?: number,
  ): AbstractStatementNode {
    //EXTEND THIS!
    throw Error(
      "AbstractStatementNode does not support child statement nodes.",
    );
  }
}
