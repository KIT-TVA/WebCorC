import { ViewContainerRef, ComponentRef } from "@angular/core";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { IStatement, Statement } from "./statement";
import { StrongWeakStatementComponent } from "../../components/editor/statements/strong-weak-statement/strong-weak-statement.component";
import { ConditionDTO } from "../condition/condition";

export interface IStrongWeakStatement extends IStatement {
    refinement : Statement | undefined 
}

/**
 * Data only representation of {@link StrongWeakStatementComponent}
 */
export class StrongWeakStatement extends Statement implements IStrongWeakStatement {

    public static readonly TYPE = "StrongWeakStatement"

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position  = new Position(0,0),
        public refinement : Statement | undefined 

    ) {
        super(name, StrongWeakStatement.TYPE , id, proven, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn: ViewContainerRef): [refinement: Refinement, ref: ComponentRef<Refinement>] | undefined {
        const statementRef = spawn.createComponent(StrongWeakStatementComponent)
        const statement = statementRef.instance as StrongWeakStatementComponent

        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.position = this.position

        if (this.refinement) {
            const child = this.refinement.toComponent(spawn)

            if (child) {
                statement.statement = child?.[0]
                statement.statementRef = child?.[1].location
            }
        }

        return [statement, statementRef]
    }
}