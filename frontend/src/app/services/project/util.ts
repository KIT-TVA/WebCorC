
import { ConditionDTO, IConditionDTO } from "../../types/condition/condition"
import { IPosition, Position } from "../../types/position"
import { CompositionStatement } from "../../types/statements/compositon-statement"
import { RepetitionStatement } from "../../types/statements/repetition-statement"
import { ISelectionStatement, SelectionStatement } from "../../types/statements/selection-statement"
import { ISimpleStatement, SimpleStatement } from "../../types/statements/simple-statement"
import { IStatement, Statement } from "../../types/statements/statement"
import { StrongWeakStatement } from "../../types/statements/strong-weak-statement"

export function importStatementsfromJSON(statement : IStatement | undefined) : Statement | undefined {
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
                importCondition(statement.preCondition),
                importCondition(statement.postCondition),
                importPosition(statement.position),
                importStatementsfromJSON((statement as ISimpleStatement).refinement)
            )

        case SelectionStatement.TYPE:
            var childs : (Statement | undefined)[] = []
            for (var child of (statement as ISelectionStatement).commands) {
                childs.push(
                    importStatementsfromJSON(child)
                )
            }

            var guards : ConditionDTO[] = []
            for (var guard of (statement as ISelectionStatement).guards) {
                guards.push(
                    importCondition(guard)
                )
            }

            return new SelectionStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                importCondition(statement.preCondition),
                importCondition(statement.postCondition),
                importPosition(statement.position),
                (statement as SelectionStatement).preProven,
                guards,
                childs
            )
        
        case RepetitionStatement.TYPE:
            return new RepetitionStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                importCondition(statement.preCondition),
                importCondition(statement.postCondition),
                importPosition(statement.position),
                (statement as RepetitionStatement).postProven,
                (statement as RepetitionStatement).preProven,
                (statement as RepetitionStatement).variantProven,
                importCondition((statement as RepetitionStatement).invariant),
                importCondition((statement as RepetitionStatement).variant),
                importCondition((statement as RepetitionStatement).guard),
                importStatementsfromJSON((statement as RepetitionStatement).loopStatement)
            )
    
        case CompositionStatement.TYPE:
            return new CompositionStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                importCondition(statement.preCondition),
                importCondition(statement.postCondition),
                importPosition(statement.position),
                importCondition((statement as CompositionStatement).intermediateCondition),
                importStatementsfromJSON((statement as CompositionStatement).firstStatement),
                importStatementsfromJSON((statement as CompositionStatement).secondStatement)
            )
    
        case StrongWeakStatement.TYPE:
            return new StrongWeakStatement(
                statement.name,
                statement.id,
                statement.proven,
                statement.comment,
                importCondition(statement.preCondition),
                importCondition(statement.postCondition),
                importPosition(statement.position),
                importStatementsfromJSON((statement as StrongWeakStatement).refinement)
            )    
    }

    return
}

function importCondition(condition : IConditionDTO) : ConditionDTO {
    return new ConditionDTO(condition.originId, condition.title, condition.content)
}

function importPosition(position : IPosition) : Position {
    return new Position(position.xinPx, position.yinPx)
}