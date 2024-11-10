import { ComponentRef, ViewContainerRef } from "@angular/core";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { ConditionDTO } from "../condition/condition";
import { SimpleStatement } from "./simple-statement";
import { RepetitionStatement } from "./repetition-statement";
import { CompositionStatement } from "./compositon-statement";
import { StrongWeakStatement } from "./strong-weak-statement";
import { SelectionStatement } from "./selection-statement";

export class Statement {

    constructor(
        public name : string,
        public type : string,
        public id : number,
        public proven : boolean,
        public comment : string,
        public preCondition : ConditionDTO,
        public postCondition : ConditionDTO,
        public position : Position 
    ) {}

    /**
     * Convert the data only statement to the corresponding component 
     * @param spawn The element to spawn the component in
     * @returns The raw statment and the component reference of the statement, used to connect the statements in the graphical editor
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public toComponent(spawn : ViewContainerRef) : [ refinement : Refinement, ref : ComponentRef<Refinement>] | undefined {
        return
    }
}

export function importStatementsfromJSON(statement : Statement | undefined) : Statement | undefined {
    if (!statement) {
        return
    }

    switch (statement.type) {
        case "AbstractStatement":
            return new SimpleStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                statement.preCondition,
                statement.postCondition,
                statement.position,
                importStatementsfromJSON((statement as SimpleStatement).statement)
            )

        case "SelectionStatement":
            let childs : (Statement | undefined)[] = []
            for (var child of (statement as SelectionStatement).commands) {
                childs.push(
                    importStatementsfromJSON(child)
                )
            }

            return new SelectionStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                statement.preCondition,
                statement.postCondition,
                statement.position,
                (statement as SelectionStatement).preProven,
                (statement as SelectionStatement).guards,
                childs
            )
        
        case "SmallRepetitionStatement":
                return new RepetitionStatement(
                    statement.name,
                    statement.id,
                    statement.proven,
                    statement.comment,
                    statement.preCondition,
                    statement.postCondition,
                    statement.position,
                    (statement as RepetitionStatement).postProven,
                    (statement as RepetitionStatement).preProven,
                    (statement as RepetitionStatement).variantProven,
                    (statement as RepetitionStatement).invariant,
                    (statement as RepetitionStatement).variant,
                    (statement as RepetitionStatement).guard,
                    importStatementsfromJSON((statement as RepetitionStatement).loopStatement)
                )
    
            case "CompositionStatement":
                return new CompositionStatement(
                    statement.name,
                    statement.id,
                    statement.proven,
                    statement.comment,
                    statement.preCondition,
                    statement.postCondition,
                    statement.position,
                    (statement as CompositionStatement).intermediateCondition,
                    importStatementsfromJSON((statement as CompositionStatement).firstStatement),
                    importStatementsfromJSON((statement as CompositionStatement).secondStatement)
                )
    
            case "StrongWeakStatement":
                return new StrongWeakStatement(
                    statement.name,
                    statement.id,
                    statement.proven,
                    statement.comment,
                    statement.preCondition,
                    statement.postCondition,
                    statement.position,
                    importStatementsfromJSON((statement as StrongWeakStatement).statement)
                )    
    }

    return
}