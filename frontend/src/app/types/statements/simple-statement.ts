
import { ComponentRef, ViewContainerRef } from "@angular/core";
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { Statement } from "./statement";
import { SimpleStatementComponent } from "../../components/editor/refinements/simple-statement/simple-statement.component";

export class SimpleStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public statement : Statement | undefined

    ) {
        super(name, "simple", id, proven, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn : ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        console.log("simple statement to component")
        const statementRef = spawn.createComponent(SimpleStatementComponent)
        const statement = statementRef.instance as SimpleStatementComponent
        statement.precondition = this.preCondition
        statement.postcondition = this.postCondition

        if (this.statement) {

            console.log("Root Statement")

            const child = this.statement.toComponent(spawn)

            console.log(child)
            
            statement.statement = child?.[0]
            statement.statementElementRef = child?.[1].location
        }
        return [statement, statementRef]
    }
}