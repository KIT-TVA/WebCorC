
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Statement } from "./statement";
import { Condition } from "../condition/condition";
import { Position } from "../position";
import { ViewContainerRef, ComponentRef } from "@angular/core";
import { Refinement } from "../refinement";
import { RepetitionStatementComponent } from "../../components/editor/statements/repetition-statement/repetition-statement.component";

export class RepetitionStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public postProven : boolean,
        public preProven : boolean,
        public variantProven : boolean,
        public invariantCondition : Condition,
        public variantCondition : Condition,
        public guardCondition : Condition,
        public loopStatement : Statement | undefined

    ) {
        super(name, "repetition", id, proven, comment, preCondition, postCondition, position)
    }

    public override toComponent(spawn: ViewContainerRef): [refinement: Refinement, ref: ComponentRef<Refinement>] | undefined {
        const statementRef = spawn.createComponent(RepetitionStatementComponent)
        const statement = statementRef.instance as RepetitionStatementComponent

        statement.precondition = this.preCondition
        statement.postcondition = this.postCondition
        statement.invariantCondition = this.invariantCondition
        statement.variantCondition = this.variantCondition
        statement.guardCondition = this.guardCondition
        statement.position = this.position

        
        if (this.loopStatement) {
            const child = this.loopStatement.toComponent(spawn)

            if (child) {
                statement.loopStatement = child?.[0]
                statement.loopStatementRef = child?.[1].location
            }
        }
        

        
        return [statement, statementRef]
    }
}