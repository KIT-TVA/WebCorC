import { ViewContainerRef, ComponentRef } from "@angular/core";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { Statement } from "./statement";
import { StrongWeakStatementComponent } from "../../components/editor/statements/strong-weak-statement/strong-weak-statement.component";
import { ConditionDTO } from "../condition/condition";

export class StrongWeakStatement extends Statement {

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
        super(name, "strongWeak", id, proven, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn: ViewContainerRef): [refinement: Refinement, ref: ComponentRef<Refinement>] | undefined {
        const statementRef = spawn.createComponent(StrongWeakStatementComponent)
        const statement = statementRef.instance as StrongWeakStatementComponent

        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.position = this.position

        if (this.statement) {
            const child = this.statement.toComponent(spawn)

            if (child) {
                statement.statement = child?.[0]
                statement.statementRef = child?.[1].location
            }
        }

        return [statement, statementRef]
    }
}