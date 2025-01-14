import { ComponentRef, ViewContainerRef } from "@angular/core";
import { ConditionDTO } from "../condition/condition";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { IStatement, Statement } from "./statement";
import { CompositionStatementComponent } from "../../components/editor/statements/composition-statement/composition-statement.component";

export interface ICompositionStatement extends IStatement {
    intermediateCondition : ConditionDTO
    firstStatement : Statement | undefined
    secondStatement : Statement | undefined
}

/**
 * Data only representation of {@link CompositionStatementComponent}.
 * Compatible with the api calls.
 */
export class CompositionStatement extends Statement implements ICompositionStatement {

    public static readonly TYPE = "CompositionStatement"

    constructor(
        name : string,
        id : number,
        proven : boolean,
        tested : boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position = new Position(0,0),
        public intermediateCondition : ConditionDTO,
        public firstStatement : Statement | undefined,
        public secondStatement : Statement | undefined,
    ) {
        super(name, CompositionStatement.TYPE ,id, proven, tested, comment, preCondition, postCondition, position)
    }


    public override toComponent(spawn: ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        const statementRef = spawn.createComponent(CompositionStatementComponent)
        const statement = statementRef.instance as CompositionStatementComponent
        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.intermediateCondition = this.intermediateCondition.convert()
        statement.position = this.position
        statement.proven = this.proven

        
        if (this.firstStatement) {
            const left = this.firstStatement.toComponent(spawn)

            if (left) {
                statement.leftStatement = left?.[0]
                statement.leftStatementRef = left?.[1].location
            }
        }

        if (this.secondStatement) {
            const right = this.secondStatement.toComponent(spawn)
            if (right) {
                statement.rightStatement = right?.[0]
                statement.rightStatementRef = right?.[1].location
            }
        }

        

        return [ statement, statementRef ]
    }
}