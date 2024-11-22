
import { ConditionDTO } from "../../types/condition/condition"
import { CompositionStatement } from "../../types/statements/compositon-statement"
import { RepetitionStatement } from "../../types/statements/repetition-statement"
import { SelectionStatement } from "../../types/statements/selection-statement"
import { SimpleStatement } from "../../types/statements/simple-statement"
import { Statement } from "../../types/statements/statement"
import { StrongWeakStatement } from "../../types/statements/strong-weak-statement"

export function importStatementsfromJSON(statement : Statement | undefined) : Statement | undefined {
    if (!statement) {
        return
    }

    switch (statement.type) {
        case SimpleStatement.TYPE:
            return new SimpleStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                new ConditionDTO(statement.preCondition.originId, statement.preCondition.title, statement.preCondition.content),
                new ConditionDTO(statement.postCondition.originId, statement.postCondition.title, statement.postCondition.content),
                statement.position,
                importStatementsfromJSON((statement as SimpleStatement).refinement)
            )

        case SelectionStatement.TYPE:
            var childs : (Statement | undefined)[] = []
            for (var child of (statement as SelectionStatement).commands) {
                childs.push(
                    importStatementsfromJSON(child)
                )
            }

            var guards : ConditionDTO[] = []
            for (var guard of (statement as SelectionStatement).guards) {
                guards.push(
                    new ConditionDTO(guard.originId, guard.title, guard.content)
                )
            }

            return new SelectionStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                new ConditionDTO(statement.preCondition.originId, statement.preCondition.title, statement.preCondition.content),
                new ConditionDTO(statement.postCondition.originId, statement.postCondition.title, statement.postCondition.content),
                statement.position,
                (statement as SelectionStatement).preProven,
                guards,
                childs
            )
        
        case RepetitionStatement.TYPE:
            var invariant = (statement as RepetitionStatement).invariant
            var variant = (statement as RepetitionStatement).variant
            var guard = (statement as RepetitionStatement).guard

            return new RepetitionStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                new ConditionDTO(statement.preCondition.originId, statement.preCondition.title, statement.preCondition.content),
                new ConditionDTO(statement.postCondition.originId, statement.postCondition.title, statement.postCondition.content),
                statement.position,
                (statement as RepetitionStatement).postProven,
                (statement as RepetitionStatement).preProven,
                (statement as RepetitionStatement).variantProven,
                new ConditionDTO(invariant.originId, invariant.title, invariant.content),
                new ConditionDTO(variant.originId, variant.title, variant.content),
                new ConditionDTO(guard.originId, guard.title, guard.content),
                importStatementsfromJSON((statement as RepetitionStatement).loopStatement)
            )
    
        case CompositionStatement.TYPE:
            var intermediateCondition = (statement as CompositionStatement).intermediateCondition
            return new CompositionStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                new ConditionDTO(statement.preCondition.originId, statement.preCondition.title, statement.preCondition.content),
                new ConditionDTO(statement.postCondition.originId, statement.postCondition.title, statement.postCondition.content),
                statement.position,
                new ConditionDTO(intermediateCondition.originId, intermediateCondition.title, intermediateCondition.content),
                importStatementsfromJSON((statement as CompositionStatement).firstStatement),
                importStatementsfromJSON((statement as CompositionStatement).secondStatement)
            )
    
        case StrongWeakStatement.TYPE:
            return new StrongWeakStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                new ConditionDTO(statement.preCondition.originId, statement.preCondition.title, statement.preCondition.content),
                new ConditionDTO(statement.postCondition.originId, statement.postCondition.title, statement.postCondition.content),
                statement.position,
                importStatementsfromJSON((statement as StrongWeakStatement).statement)
            )    
    }

    return
}