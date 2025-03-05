import { Injectable } from '@angular/core';
import { IStatement, Statement } from '../../../types/statements/statement';
import { IPosition, Position } from '../../../types/position';
import { ConditionDTO, IConditionDTO } from '../../../types/condition/condition';
import { IStrongWeakStatement, StrongWeakStatement } from '../../../types/statements/strong-weak-statement';
import { CompositionStatement, ICompositionStatement } from '../../../types/statements/compositon-statement';
import { IRepetitionStatement, RepetitionStatement } from '../../../types/statements/repetition-statement';
import { ISelectionStatement, SelectionStatement } from '../../../types/statements/selection-statement';
import { ISimpleStatement, SimpleStatement } from '../../../types/statements/simple-statement';
import { CBCFormula, ICBCFormula } from '../CBCFormula';
import { IRenaming, Renaming } from '../../tree/Renaming';

@Injectable({
  providedIn: 'root'
})
export class CbcFormulaMapperService {

  constructor() {}

  public importFormula(formula : ICBCFormula) : CBCFormula {
    
    return new CBCFormula(
      formula.type,
      formula.name,
      formula.proven,
      formula.comment,
      formula.compositionTechnique,
      formula.className,
      formula.methodName,
      formula.tested,
      formula.javaVariables,
      this.importGlobalConditions(formula.globalConditions),
      this.importCondition(formula.preCondition),
      this.importCondition(formula.postCondition),
      this.importStatement(formula.statement),
      this.importRenaming(formula.renaming),
      this.importPosition(formula.position)
    )
  }

  
  private importStatement(statement : IStatement | undefined) : Statement | undefined {
    if (!statement) {
      return
    }

    switch (statement.type) {
      case SimpleStatement.TYPE: return this.importSimpleStatement(statement)
      case SelectionStatement.TYPE: return this.importSelectionStatement(statement)
      case RepetitionStatement.TYPE: return this.importRepetitionStatement(statement)
      case CompositionStatement.TYPE: return this.importCompositionStatement(statement)
      case StrongWeakStatement.TYPE: return this.importStrongWeakStatement(statement)
    }
    return
  }

  private importSimpleStatement(statement : IStatement) : SimpleStatement {
    return new SimpleStatement(
      statement.name,
      statement.id,
      statement.proven,
      statement.tested,
      statement.comment,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      this.importPosition(statement.position),
      this.importStatement((statement as ISimpleStatement).refinement)
    )
  }

  private importSelectionStatement(statement : IStatement) : SelectionStatement {
    const childs : (Statement | undefined)[] = []
    for (const child of (statement as ISelectionStatement).commands) {
        childs.push(
            this.importStatement(child)
        )
    }

    const guards : ConditionDTO[] = []
    for (const guard of (statement as ISelectionStatement).guards) {
        guards.push(
            this.importCondition(guard)
        )
    }

    return new SelectionStatement(
        statement.name,
        statement.id,
        statement.proven,
        statement.tested,
        statement.comment,
        this.importCondition(statement.preCondition),
        this.importCondition(statement.postCondition),
        this.importPosition(statement.position),
        (statement as ISelectionStatement).preProven,
        guards,
        childs
    )
  }

  private importRepetitionStatement(statement : IStatement) : RepetitionStatement {
    return new RepetitionStatement(
      statement.name,
      statement.id,
      statement.proven,
      statement.tested,
      statement.comment,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      this.importPosition(statement.position),
      (statement as IRepetitionStatement).postProven,
      (statement as IRepetitionStatement).preProven,
      (statement as IRepetitionStatement).variantProven,
      this.importCondition((statement as IRepetitionStatement).invariant),
      this.importCondition((statement as IRepetitionStatement).variant),
      this.importCondition((statement as IRepetitionStatement).guard),
      this.importStatement((statement as IRepetitionStatement).loopStatement)
    )
  }

  private importCompositionStatement(statement : IStatement) : CompositionStatement {
    return new CompositionStatement(
      statement.name,
      statement.id,
      statement.proven,
      statement.tested,
      statement.comment,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      this.importPosition(statement.position),
      this.importCondition((statement as ICompositionStatement).intermediateCondition),
      this.importStatement((statement as ICompositionStatement).firstStatement),
      this.importStatement((statement as ICompositionStatement).secondStatement)
    )
  }

  private importStrongWeakStatement(statement : IStatement) : StrongWeakStatement {
    return new StrongWeakStatement(
      statement.name,
      statement.id,
      statement.proven,
      statement.tested,
      statement.comment,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      this.importPosition(statement.position),
      this.importStatement((statement as IStrongWeakStatement).refinement)
    )    
  }

  private importGlobalConditions(conditions : IConditionDTO[] | null) : ConditionDTO[] {
    const newConditions : ConditionDTO[] = []

    if (!conditions) {
      return newConditions
    }

    for (const condition of conditions) {
      newConditions.push(
        this.importCondition(condition)
      )
    }

    return newConditions
  }

  private importCondition(condition : IConditionDTO) : ConditionDTO {
    return new ConditionDTO(condition.originId, condition.title, condition.content)
  }

  private importPosition(position : IPosition) : Position {
    return new Position(position.xinPx, position.yinPx)
  }

  private importRenaming(renaming : IRenaming[] | null) {
    const newRenames : Renaming[] = []

    if (!renaming) {
      return newRenames
    }

    for (const rename of renaming) {
      newRenames.push(
        new Renaming(rename.type, rename.function, rename.newName)
      )
    }

    return newRenames
  }

}
