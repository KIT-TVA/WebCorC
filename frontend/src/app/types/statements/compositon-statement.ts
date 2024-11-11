import { ComponentRef, ViewContainerRef } from "@angular/core";
import { ConditionDTO } from "../condition/condition";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { Statement } from "./statement";
import { CompositionStatementComponent } from "../../components/editor/statements/composition-statement/composition-statement.component";

/**
 * Data only representation of {@link CompositionStatementComponent}.
 * Compatible with the api calls.
 */
export class CompositionStatement extends Statement {

    public static readonly TYPE = "CompositionStatement"

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position,
        public intermediateCondition : ConditionDTO,
        public firstStatement : Statement | undefined,
        public secondStatement : Statement | undefined,
    ) {
        super(name, CompositionStatement.TYPE ,id, proven, comment, preCondition, postCondition, position)
    }


    public override toComponent(spawn: ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        const statementRef = spawn.createComponent(CompositionStatementComponent)
        const statement = statementRef.instance as CompositionStatementComponent
        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.intermediateCondition = this.intermediateCondition.convert()
        statement.position = this.position

        
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