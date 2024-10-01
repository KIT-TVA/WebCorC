import { Statement } from "./statement";
import { ConditionDTO } from "../condition/condition";
import { Position } from "../position";
import { ViewContainerRef, ComponentRef } from "@angular/core";
import { Refinement } from "../refinement";
import { RepetitionStatementComponent } from "../../components/editor/statements/repetition-statement/repetition-statement.component";

/**
 * Data only representation of {@link RepetitionStatementComponent}
 */
export class RepetitionStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position,
        public postProven : boolean,
        public preProven : boolean,
        public variantProven : boolean,
        public invariantCondition : ConditionDTO,
        public variantCondition : ConditionDTO,
        public guardCondition : ConditionDTO,
        public loopStatement : Statement | undefined

    ) {
        super(name, "repetition", id, proven, comment, preCondition, postCondition, position)
    }

    
    public override toComponent(spawn: ViewContainerRef): [refinement: Refinement, ref: ComponentRef<Refinement>] | undefined {
        const statementRef = spawn.createComponent(RepetitionStatementComponent)
        const statement = statementRef.instance as RepetitionStatementComponent

        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.invariantCondition = this.invariantCondition.convert()
        statement.variantCondition = this.variantCondition.convert()
        statement.guardCondition = this.guardCondition.convert()
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