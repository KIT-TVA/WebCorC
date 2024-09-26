import { ComponentRef, ViewContainerRef } from "@angular/core";
import { Condition } from "../condition/condition";
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { Statement } from "./statement";
import { CompositionStatementComponent } from "../../components/editor/refinements/composition-statement/composition-statement.component";

export class CompositionStatement extends Statement {


    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public intermediateCondition : Condition,
        public leftStatement : Statement | undefined,
        public rightStatement : Statement | undefined,
    ) {
        super(name, "composition" ,id, proven, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn: ViewContainerRef): [ refinement : Refinement, ref : ComponentRef<Refinement>] {
        const statementRef = spawn.createComponent(CompositionStatementComponent)
        const statement = statementRef.instance as CompositionStatementComponent
        statement.precondition = this.preCondition
        statement.postcondition = this.postCondition
        statement.intermediateCondition = this.intermediateCondition
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