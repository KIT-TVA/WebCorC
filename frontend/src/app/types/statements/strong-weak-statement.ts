import { ViewContainerRef, ComponentRef } from "@angular/core";
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { Statement } from "./statement";
import { StrongWeakStatementComponent } from "../../components/editor/refinements/strong-weak-statement/strong-weak-statement.component";

export class StrongWeakStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public statement : Statement

    ) {
        super(name, "strongWeak", id, proven, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn: ViewContainerRef): [refinement: Refinement, ref: ComponentRef<Refinement>] | undefined {
        const statementRef = spawn.createComponent(StrongWeakStatementComponent)
        const statement = statementRef.instance as StrongWeakStatementComponent

        statement.precondition = this.preCondition
        statement.postcondition = this.postCondition

        const child = this.statement.toComponent(spawn)

        if (child) {
            statement.statement = child?.[0]
            statement.statementRef = child?.[1].location
        }

        return [statement, statementRef]
    }
}