import { ComponentRef, ViewContainerRef } from "@angular/core";
import { Condition } from "../condition/condition";
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { Statement } from "./statement";
import { SelectionStatementComponent } from "../../components/editor/statements/selection-statement/selection-statement.component";

export class SelectionStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public preProven : boolean,
        public guards : Condition[],
        public statements : (Statement | undefined)[]
    ) {
        super(name, "selection", id, proven, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn: ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        const statementRef = spawn.createComponent(SelectionStatementComponent)
        const statement = statementRef.instance as SelectionStatementComponent
        statement.precondition = this.preCondition
        statement.postcondition = this.postCondition

        statement.guards = this.guards
        statement.position = this.position

        // Todo : Import the childs correctly and link them 
        for (const child of this.statements) {
            if (child) {
                const childElement = child.toComponent(spawn)

                statement.importSelection(childElement?.[0], childElement?.[1].location)
            }
        }

        return [statement, statementRef]
    }
}