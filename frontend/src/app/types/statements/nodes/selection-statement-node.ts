import { AbstractStatementNode } from "./abstract-statement-node";
import { ISelectionStatement } from "../selection-statement";
import { BehaviorSubject } from "rxjs";
import { Condition, ICondition } from "../../condition/condition";
import {
  createEmptyStatementNode,
  statementNodeUtils,
} from "./statement-node-utils";
import { StatementType } from "../abstract-statement";

export class SelectionStatementNode extends AbstractStatementNode {
  public guards: BehaviorSubject<ICondition>[];
  override statement!: ISelectionStatement;

  constructor(
    statement: ISelectionStatement,
    parent: AbstractStatementNode | undefined,
  ) {
    super(statement, parent);
    this.guards = statement.guards.map(
      (g) => new BehaviorSubject<ICondition>(g),
    );
    this.children = statement.commands.map((c) =>
      c ? statementNodeUtils(c, this) : undefined,
    );
  }

  override overridePrecondition(condition: BehaviorSubject<ICondition>) {
    super.overridePrecondition(condition);
    this.children.forEach((c, index) => {
      if (c && this.guards[index]) {
        const computedCondition = new BehaviorSubject<ICondition>(
          new Condition(
            condition.getValue().condition +
              " & " +
              this.guards[index].getValue().condition,
          ),
        );
        c.overridePrecondition(computedCondition);
        c.preconditionEditable.next(this.preconditionEditable.value);
      }
    });
  }

  override deleteChild(node: AbstractStatementNode) {
    const index = this.children.findIndex((child) => child == node);
    this.children[index] = undefined;
    this.statement.commands[index] = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override overridePostcondition(condition: BehaviorSubject<ICondition>) {
    super.overridePostcondition(condition);
    //TODO check if we are deleting the postcondition of a statement with a different postcondition than this statement
    this.children.forEach((child) => {
      child?.overridePostcondition(condition);
      child?.postconditionEditable.next(this.postconditionEditable.value);
    });
  }

  override checkConditionSync(child: AbstractStatementNode): boolean {
    if (child.statement.type == "REPETITION") {
      return true;
    }
    this.getConditionConflicts(child);
    return (
      child.postcondition.getValue().condition ==
      this.postcondition.getValue().condition
    );
  }

  override getConditionConflicts(child: AbstractStatementNode): {
    version1: BehaviorSubject<ICondition>;
    version2: BehaviorSubject<ICondition>;
    type: "PRECONDITION" | "POSTCONDITION";
  }[] {
    const conflicts: {
      version1: BehaviorSubject<ICondition>;
      version2: BehaviorSubject<ICondition>;
      type: "PRECONDITION" | "POSTCONDITION";
    }[] = [];

    // If the child is a repetition, ignore differences in conditions — repetition statements
    // can have different internal conditions (invariant/guard/variant) and shouldn't
    // be treated as conflicts with their parent here.
    if (child.statement.type == "REPETITION") {
      return conflicts;
    }

    if (this.postcondition.getValue() != child.postcondition.getValue()) {
      if (
        this.postcondition.getValue().condition ===
        child.postcondition.getValue().condition
      ) {
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

  override finalize() {
    super.finalize();
    this.children.forEach((c) => {
      c?.finalize();
    });
    this.statement.guards = [];
    this.guards.forEach((g) => {
      this.statement.guards.push(g.getValue());
    });
  }

  addSelection() {
    const condition = new BehaviorSubject<ICondition>(new Condition(""));
    this.guards.push(condition);
    this.children.push(undefined);
    this.statement.guards.push(condition.getValue());
    this.statement.commands.push(undefined);
  }

  setSelection(index: number, node: AbstractStatementNode) {
    if (index < this.children.length) {
      this.children[index] = node;
      this.statement.commands[index] = node.statement;
    }
  }

  override createChild(
    statementType: StatementType,
    index?: number,
  ): AbstractStatementNode {
    const idx = index ?? 0;
    const statementNode = createEmptyStatementNode(statementType, this);
    // If a guard exists for this branch, compute precondition as parentPrecondition & guard
    if (this.guards[idx]) {
      const computedCondition = new BehaviorSubject<ICondition>(
        new Condition(
          this.precondition.getValue().condition +
            " & " +
            this.guards[idx].getValue().condition,
        ),
      );
      statementNode.overridePrecondition(computedCondition);
      statementNode.preconditionEditable.next(this.preconditionEditable.value);
    } else {
      statementNode.overridePrecondition(this.precondition);
      statementNode.preconditionEditable.next(this.preconditionEditable.value);
    }
    // All branches should share the same postcondition as the selection
    statementNode.overridePostcondition(this.postcondition);
    statementNode.postconditionEditable.next(this.postconditionEditable.value);
    this.addChild(statementNode, idx ?? 0);
    return statementNode;
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
