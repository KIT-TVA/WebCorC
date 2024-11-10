import { ComponentRef, ViewContainerRef } from "@angular/core";
import { Condition, ConditionDTO } from "../condition/condition";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { Statement } from "./statement";
import { SelectionStatementComponent } from "../../components/editor/statements/selection-statement/selection-statement.component";

/**
 * Data only representation of {@link SelectionStatementComponent}
 */
export class SelectionStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position,
        public preProven : boolean,
        public guards : ConditionDTO[],
        public commands : (Statement | undefined)[]
    ) {
        super(name, "SelectionStatement", id, proven, comment, preCondition, postCondition, position)
    }

    
    public override toComponent(spawn: ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        const statementRef = spawn.createComponent(SelectionStatementComponent)
        const statement = statementRef.instance as SelectionStatementComponent
        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()

        const guards : Condition[] = []

        for (const guard of this.guards) {
            guards.push(guard.convert())
        }

        statement.guards = guards
        statement.position = this.position


        for (const child of this.commands) {
            if (child) {
                const childElement = child.toComponent(spawn)

                statement.importSelection(childElement?.[0], childElement?.[1].location)
            }
        }

        return [statement, statementRef]
    }
}