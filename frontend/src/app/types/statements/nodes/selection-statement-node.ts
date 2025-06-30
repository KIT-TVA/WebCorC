import {AbstractStatementNode} from "./abstract-statement-node";
import {ISelectionStatement} from "../selection-statement";
import {signal, Signal, WritableSignal} from "@angular/core";
import {ICondition} from "../../condition/condition";
import {createStatementNode} from "./createStatementNode";

export class SelectionStatementNode extends AbstractStatementNode {
    public guards: WritableSignal<ICondition>[]

    constructor(statement: ISelectionStatement, parent: AbstractStatementNode | undefined) {
        super(statement, parent);
        this.guards = statement.guards.map(g => signal(g))
        this.children = statement.commands.map(c => c ? createStatementNode(c, this) : undefined)
    }

    override overridePrecondition(sourceNode: AbstractStatementNode, condition: WritableSignal<ICondition>) {
        super.overridePrecondition(sourceNode, condition);
        this.children.forEach(c => {
            if (c) {
                c.overridePrecondition(this, condition) //TODO condition && guard
            }
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override overridePostcondition(sourceNode: AbstractStatementNode, condition: Signal<ICondition>) {
        //TODO or all postconditions ??
    }
}