
import { ComponentRef, ViewContainerRef } from "@angular/core";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { Statement } from "./statement";
import { SimpleStatementComponent } from "../../components/editor/statements/simple-statement/simple-statement.component";
import { ConditionDTO } from "../condition/condition";

export class SimpleStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position,
        public statement : Statement | undefined

    ) {
        super(name, "simple", id, proven, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn : ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        const statementRef = spawn.createComponent(SimpleStatementComponent)
        const statement = statementRef.instance as SimpleStatementComponent
        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.condition = this.name
        statement.position = this.position

        if (this.statement) {
            const child = this.statement.toComponent(spawn)
            statement.statement = child?.[0]
            statement.statementElementRef = child?.[1].location
        }
        return [statement, statementRef]
    }
}