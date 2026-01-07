import {signal, WritableSignal} from "@angular/core";
import {ICondition} from "../../condition/condition";
import {IAbstractStatement} from "../abstract-statement";
import {IPosition} from "../../position";

export class AbstractStatementNode {
    private _index:number = 0;
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
        parent?.overridePostcondition(this, this.postcondition, true);
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
     * @param preserveIfNewConditionEmpty
     */
    public overridePostcondition(
        sourceNode: AbstractStatementNode,
        condition: WritableSignal<ICondition>,
        preserveIfNewConditionEmpty = false,
    ): void {
        const oldCondition = this.postcondition();
        this.postcondition = condition;
        if (preserveIfNewConditionEmpty && condition().condition.length < 1) {
            condition.set(oldCondition);
        }
    }

    public deleteChild(node: AbstractStatementNode) {
        //EXTEND THIS!
        if (this.children.includes(node)) {
            this.children = this.children.filter(
                (filteredNode) => filteredNode != node,
            );
        }
        this.overridePrecondition(this, signal(this.precondition()));
        this.overridePostcondition(this, signal(this.postcondition()));
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

    public set index(value: number) {
        this._index = value;
    }

    public get index(): number {
        return this._index;
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
            this.postcondition() == child.postcondition();
        if (!inSync) {
            this.getConditionConflicts(child);
        }
        inSync =
            this.precondition() == child.precondition() &&
            this.postcondition() == child.postcondition();
        return inSync;
    }

    public addChild(statement: AbstractStatementNode, index: number) {
        //EXTEND THIS!
    }

    getConditionConflicts(child: AbstractStatementNode): {
        version1: WritableSignal<ICondition>;
        version2: WritableSignal<ICondition>;
        type: "PRECONDITION" | "POSTCONDITION";
    }[] {
        const conflicts = [];
        if (this.precondition() != child.precondition()) {
            if (this.precondition().condition === child.precondition().condition) {
                this.overridePrecondition(child, child.precondition);
            } else {
                conflicts.push({
                    version1: this.precondition,
                    version2: child.precondition,
                    type: "PRECONDITION",
                });
            }
        }
        if (this.postcondition() != child.postcondition()) {
            if (this.postcondition().condition === child.postcondition().condition) {
                this.overridePostcondition(child, child.postcondition);
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
}
