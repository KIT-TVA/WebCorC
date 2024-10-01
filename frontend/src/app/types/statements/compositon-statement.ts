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

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position,
        public intermediateCondition : ConditionDTO,
        public leftStatement : Statement | undefined,
        public rightStatement : Statement | undefined,
    ) {
        super(name, "composition" ,id, proven, comment, preCondition, postCondition, position)
    }


    public override toComponent(spawn: ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        const statementRef = spawn.createComponent(CompositionStatementComponent)
        const statement = statementRef.instance as CompositionStatementComponent
        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.intermediateCondition = this.intermediateCondition.convert()
        statement.position = this.position

        
        if (this.leftStatement) {
            const left = this.leftStatement.toComponent(spawn)

            if (left) {
                statement.leftStatement = left?.[0]
                statement.leftStatementRef = left?.[1].location
            }
        }

        if (this.rightStatement) {
            const right = this.rightStatement.toComponent(spawn)
            if (right) {
                statement.rightStatement = right?.[0]
                statement.rightStatementRef = right?.[1].location
            }
        }

        

        return [ statement, statementRef ]
    }
}