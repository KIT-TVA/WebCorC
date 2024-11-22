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

    public static readonly TYPE = "SmallRepetitionStatement"

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : ConditionDTO,
        postCondition : ConditionDTO,
        position : Position = new Position(0,0),
        public postProven : boolean,
        public preProven : boolean,
        public variantProven : boolean,
        public invariant : ConditionDTO,
        public variant : ConditionDTO,
        public guard : ConditionDTO,
        public loopStatement : Statement | undefined

    ) {
        super(name, RepetitionStatement.TYPE, id, proven, comment, preCondition, postCondition, position)
    }

    
    public override toComponent(spawn: ViewContainerRef): [refinement: Refinement, ref: ComponentRef<Refinement>] | undefined {
        const statementRef = spawn.createComponent(RepetitionStatementComponent)
        const statement = statementRef.instance as RepetitionStatementComponent

        statement.precondition = this.preCondition.convert()
        statement.postcondition = this.postCondition.convert()
        statement.invariantCondition = this.invariant.convert()
        statement.variantCondition = this.variant.convert()
        statement.guardCondition = this.guard.convert()
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