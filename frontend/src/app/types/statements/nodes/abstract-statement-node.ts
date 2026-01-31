import { BehaviorSubject } from "rxjs";
import { ICondition } from "../../condition/condition";
import { IAbstractStatement, StatementType } from "../abstract-statement";
import { IPosition } from "../../position";

export class AbstractStatementNode {
  public statement: IAbstractStatement;
  public parent: AbstractStatementNode | undefined;
  public children: (AbstractStatementNode | undefined)[] = [];
  public precondition: BehaviorSubject<ICondition>;
  public postcondition: BehaviorSubject<ICondition>;
  public preconditionEditable = new BehaviorSubject<boolean>(true);
  public postconditionEditable = new BehaviorSubject<boolean>(true);

  constructor(
    statement: IAbstractStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    this.statement = statement;
    this.parent = parent;
    this.precondition = new BehaviorSubject<ICondition>(statement.preCondition);
    this.postcondition = new BehaviorSubject<ICondition>(statement.postCondition);
  }

  public overridePrecondition(condition: BehaviorSubject<ICondition>): void {
    this.precondition = condition;
  }

  public overridePostcondition(condition: BehaviorSubject<ICondition>): void {
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

  public finalize() {
    this.statement.preCondition = this.precondition.getValue();
    this.statement.postCondition = this.postcondition.getValue();
    this.children.forEach((c) => c?.finalize());
  }

  public checkConditionSync(child: AbstractStatementNode) {
    let inSync =
      (this.precondition.getValue() == child.precondition.getValue() &&
        this.postcondition.getValue() == child.postcondition.getValue()) ||
      child.statement.type == "REPETITION";
    if (!inSync) {
      this.getConditionConflicts(child);
    }
    inSync =
      (this.precondition.getValue() == child.precondition.getValue() &&
        this.postcondition.getValue() == child.postcondition.getValue()) ||
      child.statement.type == "REPETITION";
    return inSync;
  }

  public addChild(statement: AbstractStatementNode, index: number) {
    throw Error(
      "AbstractStatementNode does not support child statement nodes.",
    );
  }

  getConditionConflicts(child: AbstractStatementNode): {
    version1: BehaviorSubject<ICondition>;
    version2: BehaviorSubject<ICondition>;
    type: "PRECONDITION" | "POSTCONDITION";
  }[] {
    const conflicts: {
      version1: BehaviorSubject<ICondition>;
      version2: BehaviorSubject<ICondition>;
      type: "PRECONDITION" | "POSTCONDITION";
    }[] = [];

    if (child.statement.type == "REPETITION") {
      return conflicts;
    }

    if (this.precondition.getValue() != child.precondition.getValue()) {
      if (this.precondition.getValue().condition === child.precondition.getValue().condition) {
        child.overridePrecondition(this.precondition);
      } else {
        conflicts.push({
          version1: this.precondition,
          version2: child.precondition,
          type: "PRECONDITION",
        });
      }
    }
    if (this.postcondition.getValue() != child.postcondition.getValue()) {
      if (this.postcondition.getValue().condition === child.postcondition.getValue().condition) {
        child.overridePostcondition(this.postcondition);
      } else {
        conflicts.push({
          version1: this.postcondition,
          version2: child.postcondition,
          type: "POSTCONDITION",
        });
      }
    }
    return conflicts;
  }

  createChild(
    _statementType: StatementType,
    _index?: number,
  ): AbstractStatementNode {
    throw Error(
      "AbstractStatementNode does not support child statement nodes.",
    );
  }
}
