
import { ComponentRef, ViewContainerRef } from "@angular/core";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { IStatement, Statement } from "./statement";
import { SimpleStatementComponent } from "../../components/editor/statements/simple-statement/simple-statement.component";
import { ConditionDTO } from "../condition/condition";

export interface ISimpleStatement extends IStatement {
    refinement : Statement | undefined
}


/**
 * Data only representation of {@link SimpleStatementComponent}
 */
export class SimpleStatement extends Statement implements ISimpleStatement {

    public static readonly TYPE : string = "AbstractStatement"

    constructor(
        name : string,
        id : number,
        proven : boolean,
        tested: boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position = new Position(0,0),
        public refinement : Statement | undefined

    ) {
        super(name, SimpleStatement.TYPE , id, proven, tested, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn : ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        const statementRef = spawn.createComponent(SimpleStatementComponent)
        const statement = statementRef.instance as SimpleStatementComponent
        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.condition = this.name
        statement.position = this.position
        statement.proven = this.proven

        if (this.refinement) {
            const child = this.refinement.toComponent(spawn)
            statement.statement = child?.[0]
            statement.statementElementRef = child?.[1].location
        }
        return [statement, statementRef]
    }
}