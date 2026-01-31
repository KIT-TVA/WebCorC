import { AbstractStatementNode } from "./abstract-statement-node";
import { ISelectionStatement } from "../selection-statement";
import { BehaviorSubject, combineLatest, Subscription } from "rxjs";
import { Condition, ICondition } from "../../condition/condition";
import {
  createEmptyStatementNode,
  statementNodeUtils,
} from "./statement-node-utils";
import { StatementType } from "../abstract-statement";

export class SelectionStatementNode extends AbstractStatementNode {
  public guards: BehaviorSubject<ICondition>[];
  override statement!: ISelectionStatement;
  private childSubscriptions: Subscription[] = [];

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

    // Initialize subscriptions for existing children
    this.children.forEach((_, index) => {
      this.setupChildPreconditionSubscription(index);
    });
  }

  private setupChildPreconditionSubscription(index: number) {
    if (this.childSubscriptions[index]) {
      this.childSubscriptions[index].unsubscribe();
    }

    const child = this.children[index];
    if (!child || !this.guards[index]) return;

    // Create a subject that we will update with the computed condition
    // We initialize it with the current value
    const initialParentPre = this.precondition.getValue();
    const initialGuard = this.guards[index].getValue();
    const computedPreconditionSubject = new BehaviorSubject<ICondition>(
      new Condition(
        initialParentPre.condition + " && " + initialGuard.condition,
      ),
    );

    child.overridePrecondition(computedPreconditionSubject);
    child.preconditionEditable.next(false);

    this.childSubscriptions[index] = combineLatest([
      this.precondition,
      this.guards[index],
    ]).subscribe(([parentPre, guard]) => {
      const newCond = new Condition(
        parentPre.condition + " && " + guard.condition,
      );
      // Only update if different to avoid infinite loops or unnecessary updates?
      // BehaviorSubject.next() will emit even if value is same object reference if we don't check.
      // But here we create a new Condition object every time.
      computedPreconditionSubject.next(newCond);
    });
  }

  override overridePrecondition(condition: BehaviorSubject<ICondition>) {
    super.overridePrecondition(condition);
    // Re-setup all subscriptions because this.precondition has changed
    this.children.forEach((_, index) => {
      this.setupChildPreconditionSubscription(index);
    });
  }

  override deleteChild(node: AbstractStatementNode) {
    const index = this.children.findIndex((child) => child == node);
    if (index !== -1) {
      if (this.childSubscriptions[index]) {
        this.childSubscriptions[index].unsubscribe();
        delete this.childSubscriptions[index]; // or splice if we are removing the slot
      }
      this.children[index] = undefined;
      this.statement.commands[index] = undefined;
    }
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
    // No subscription needed yet as there is no child node
  }

  setSelection(index: number, node: AbstractStatementNode) {
    if (index < this.children.length) {
      this.children[index] = node;
      this.statement.commands[index] = node.statement;
      this.setupChildPreconditionSubscription(index);

      // Also sync postcondition
      node.overridePostcondition(this.postcondition);
      node.postconditionEditable.next(this.postconditionEditable.value);
    }
  }

  override createChild(
    statementType: StatementType,
    index?: number,
  ): AbstractStatementNode {
    const idx = index ?? 0;
    const statementNode = createEmptyStatementNode(statementType, this);

    // We add the child first, then setup subscriptions
    // But addChild calls setSelection which calls setupChildPreconditionSubscription
    this.addChild(statementNode, idx);

    return statementNode;
  }

  removeSelection() {
    const index = this.guards.length - 1;
    if (this.childSubscriptions[index]) {
      this.childSubscriptions[index].unsubscribe();
      this.childSubscriptions.pop();
    }
    this.guards.pop();
    this.children.pop();
    this.statement.guards.pop();
    this.statement.commands.pop();
  }

  override addChild(statement: AbstractStatementNode, index: number) {
    this.setSelection(index, statement);
  }
}
