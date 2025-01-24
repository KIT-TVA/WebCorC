import { Injectable } from '@angular/core';
import { EMFCbcFormula } from './emf-cbc-formula';
import { EMFCondition, EMFConditions, GlobalEMFConditions } from './emf-condition';
import { CBCFormula } from '../../project/CBCFormula';
import { EMFJavaVariables, EMFVariable, EMFVariables } from './emf-java-variable';
import { ConditionDTO } from '../../../types/condition/condition';
import { EMFCompositionStatement, EMFRepetitionStatement, EMFSelectionStatement, EMFSimpleStatement, EMFStatement, EMFStrongWeakStatement } from './emf-statement';
import { SimpleStatement } from '../../../types/statements/simple-statement';
import { SelectionStatement } from '../../../types/statements/selection-statement';
import { Statement } from '../../../types/statements/statement';
import { RepetitionStatement } from '../../../types/statements/repetition-statement';
import { CompositionStatement } from '../../../types/statements/compositon-statement';
import { StrongWeakStatement } from '../../../types/statements/strong-weak-statement';
import { IRenaming, Renaming } from '../Renaming';

@Injectable({
  providedIn: 'root'
})
export class EmfMapperService {

  constructor() { }


  public toCBCFormula(emfCbcFormula : EMFCbcFormula) : CBCFormula {

    const statement = this.toStatement(emfCbcFormula.statement)
    let precondition = this.toConditon(emfCbcFormula.preCondition)

    if (precondition.originId  == -1) {
      precondition = statement?.preCondition ? statement.preCondition : new ConditionDTO(0)
    }

    let postcondition = this.toConditon(emfCbcFormula.postCondition)

    if (postcondition.originId == -1) {
      postcondition = statement?.postCondition ? statement.postCondition : new ConditionDTO(0)
    }

    return new CBCFormula(
      emfCbcFormula.type,
      emfCbcFormula.name,
      emfCbcFormula.proven,
      emfCbcFormula.comment,
      emfCbcFormula.compositionTechnique,
      emfCbcFormula.className,
      emfCbcFormula.methodName,
      emfCbcFormula.tested,
      this.toVariables(emfCbcFormula.javaVariables),
      this.toGlobalConditions(emfCbcFormula.globalConditions),
      precondition,
      postcondition,
      statement,
      this.importRenaming(emfCbcFormula.renaming)
    )

  }

  public toEMFCbcFormula(cbcFormula : CBCFormula) : EMFCbcFormula {
    return {
      type : cbcFormula.type,
      name : cbcFormula.name,
      proven : cbcFormula.proven,
      comment : cbcFormula.comment,
      compositionTechnique : cbcFormula.compositionTechnique,
      className : cbcFormula.className,
      methodName : cbcFormula.methodName,
      tested : cbcFormula.tested,
      javaVariables : this.toEMFJavaVariables(cbcFormula.javaVariables),
      globalConditions : this.toEMFGlobalConditions(cbcFormula.globalConditions),
      preCondition : this.toEMFCondition(cbcFormula.preCondition),
      postCondition : this.toEMFCondition(cbcFormula.postCondition),
      statement : this.toEMFStatement(cbcFormula.statement),
      renaming : cbcFormula.renaming
    }
  }

  private toEMFStatement(statement : Statement | null | undefined) : EMFStatement | undefined {
    if (!statement) return

    switch (statement.type) {
      case SimpleStatement.TYPE:
        return {
          name : statement.name,
          type : statement.type,
          id : statement.id,
          proven : statement.proven,
          tested : statement.tested,
          comment : statement.comment,
          preCondition : this.toEMFCondition(statement.preCondition),
          postCondition : this.toEMFCondition(statement.postCondition),
          refinement : {
            name : statement.name,
            type : statement.type,
            preCondition : this.toEMFCondition(statement.preCondition),
            postCondition: this.toEMFCondition(statement.postCondition),
            proven: statement.proven,
            tested: statement.tested
          } 
        } as EMFSimpleStatement

      case SelectionStatement.TYPE:
        const childs : (EMFStatement | undefined)[] = []
        for (const child of (statement as SelectionStatement).commands) {
          childs.push(
            this.toEMFStatement(child)
          )
        }

        const guards : EMFCondition[] = []
        for (const guard of (statement as SelectionStatement).guards) {
          guards.push(
            this.toEMFCondition(guard)
          )
        }
        return {
          name : statement.name,
          type : statement.type,
          id : statement.id,
          proven : statement.proven,
          tested : statement.tested,
          comment : statement.comment,
          preCondition : this.toEMFCondition(statement.preCondition),
          postCondition : this.toEMFCondition(statement.postCondition),
          refinement : {
            name : statement.name,
            type : statement.type,
            preCondition : this.toEMFCondition(statement.preCondition),
            postCondition: this.toEMFCondition(statement.postCondition),
            proven: statement.proven,
            tested: statement.tested,
            guards : guards,
            commands : childs,
            preProven : (statement as SelectionStatement).preProven,
          },
          
        } as EMFSelectionStatement

      case RepetitionStatement.TYPE:
        return {
          name : statement.name,
          type : statement.type,
          id : statement.id,
          proven : statement.proven,
          tested : statement.tested,
          comment : statement.comment,
          preCondition : this.toEMFCondition(statement.preCondition),
          postCondition : this.toEMFCondition(statement.postCondition),
          refinement : {
            name : statement.name,
            type : statement.type,
            preCondition : this.toEMFCondition(statement.preCondition),
            postCondition: this.toEMFCondition(statement.postCondition),
            proven: statement.proven,
            tested: statement.tested,
            postProven : (statement as RepetitionStatement).postProven,
            preProven : (statement as RepetitionStatement).preProven,
            variantProven : (statement as RepetitionStatement).variantProven,
            invariant : this.toEMFCondition((statement as RepetitionStatement).invariant),
            variant : this.toEMFCondition((statement as RepetitionStatement).variant),
            guard : this.toEMFCondition((statement as RepetitionStatement).guard),
            loopStatement : this.toEMFStatement((statement as RepetitionStatement).loopStatement),
          }
        } as EMFRepetitionStatement

      case CompositionStatement.TYPE:
        return {
          name : statement.name,
          type : statement.type,
          id : statement.id,
          proven : statement.proven,
          tested : statement.tested,
          comment : statement.comment,
          preCondition : this.toEMFCondition(statement.preCondition),
          postCondition : this.toEMFCondition(statement.postCondition),
          refinement : {
            name : statement.name,
            type : statement.type,
            preCondition : this.toEMFCondition(statement.preCondition),
            postCondition: this.toEMFCondition(statement.postCondition),
            proven: statement.proven,
            tested: statement.tested,
            intermediateCondition : this.toEMFCondition((statement as CompositionStatement).intermediateCondition),
            firstStatement : this.toEMFStatement((statement as CompositionStatement).firstStatement),
            secondStatement : this.toEMFStatement((statement as CompositionStatement).secondStatement),
          } 
        } as EMFCompositionStatement

        case StrongWeakStatement.TYPE:
          return {
            name : statement.name,
            type : statement.type,
            id : statement.id,
            proven : statement.proven,
            tested : statement.tested,
            comment : statement.comment,
            preCondition : this.toEMFCondition(statement.preCondition),
            postCondition : this.toEMFCondition(statement.postCondition),
            refinement : {
              name : statement.name,
              type : statement.type,
              preCondition : this.toEMFCondition(statement.preCondition),
              postCondition: this.toEMFCondition(statement.postCondition),
              proven: statement.proven,
              tested: statement.tested
            }
          } as EMFStrongWeakStatement
    }

    return
  } 

  private toEMFGlobalConditions(conditions : ConditionDTO[]) : EMFConditions {
    const emfCondtions : EMFConditions = new GlobalEMFConditions()
    for (const condition of conditions) {
      emfCondtions.conditions.push(
        this.toEMFCondition(condition)
      )
    }

    return emfCondtions
  }

  private toEMFCondition(condition : ConditionDTO) : EMFCondition {
    return { name : condition.content }
  }

  private toEMFJavaVariables(javaVariables : string[]) : EMFJavaVariables {
    const variables : EMFVariables = new EMFJavaVariables()
    for (const variable of javaVariables) {
      variables.variables.push(
        this.toEMFVariable(variable)
      )
    }

    return variables
  }



  private toEMFVariable(javaVariable : string) : EMFVariable {
    return { name : javaVariable }
  }

  private toStatement(emfStatement : EMFStatement | undefined) : Statement | undefined {
    if (!emfStatement) {
      return
    }

    switch (emfStatement.type) {
      case SimpleStatement.TYPE:
        return new SimpleStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.refinement.proven,
          emfStatement.tested,
          emfStatement.comment,
          this.toConditon(emfStatement.preCondition),
          this.toConditon(emfStatement.postCondition),
          undefined,
          undefined
          //this.toStatement((emfStatement as EMFSimpleStatement).refinement)
        )
      
      case SelectionStatement.TYPE: 
        const childs : (Statement | undefined)[] = []
        for (const child of (emfStatement as EMFSelectionStatement).refinement.commands) {
          childs.push(
            this.toStatement(child)
          )
        }

        const guards : ConditionDTO[] = []
        for (const guard of (emfStatement as EMFSelectionStatement).refinement.guards) {
          guards.push(
            this.toConditon(guard)
          )
        }

        return new SelectionStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.tested,
          emfStatement.comment,
          this.toConditon(emfStatement.preCondition),
          this.toConditon(emfStatement.postCondition),
          undefined,
          (emfStatement as EMFSelectionStatement).refinement.preProven,
          guards,
          childs
        )
      
      case RepetitionStatement.TYPE:
        return new RepetitionStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.tested,
          emfStatement.comment,
          this.toConditon(emfStatement.preCondition),
          this.toConditon(emfStatement.postCondition),
          undefined,
          (emfStatement as EMFRepetitionStatement).refinement.postProven,
          (emfStatement as EMFRepetitionStatement).refinement.preProven,
          (emfStatement as EMFRepetitionStatement).refinement.variantProven,
          this.toConditon((emfStatement as EMFRepetitionStatement).refinement.invariant),
          this.toConditon((emfStatement as EMFRepetitionStatement).refinement.variant),
          this.toConditon((emfStatement as EMFRepetitionStatement).refinement.guard),
          this.toStatement((emfStatement as EMFRepetitionStatement).refinement.loopStatement)
        )

      case CompositionStatement.TYPE:
        return new CompositionStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.tested,
          emfStatement.comment,
          this.toConditon(emfStatement.preCondition),
          this.toConditon(emfStatement.postCondition),
          undefined,
          this.toConditon((emfStatement as EMFCompositionStatement).refinement.intermediateCondition),
          this.toStatement((emfStatement as EMFCompositionStatement).refinement.firstStatement),
          this.toStatement((emfStatement as EMFCompositionStatement).refinement.secondStatement),
        )

      case StrongWeakStatement.TYPE:
        return new StrongWeakStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.tested,
          emfStatement.comment,
          this.toConditon(emfStatement.preCondition),
          this.toConditon(emfStatement.postCondition),
          undefined,
          undefined
          //this.toStatement((emfStatement as EMFStrongWeakStatement).refinement)
        )

      default: 
        return new SimpleStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.refinement.proven,
          emfStatement.tested,
          emfStatement.comment,
          this.toConditon(emfStatement.preCondition),
          this.toConditon(emfStatement.postCondition),
          undefined,
          undefined,
          // this.toStatement((emfStatement as EMFSimpleStatement).refinement)
        )
    }

    return
  }


  private toConditon(emfCondition : EMFCondition) : ConditionDTO {
    return emfCondition ? new ConditionDTO(0, "", emfCondition.name) : new ConditionDTO(-1)
  }

  private toVariables(emfJavaVariables : EMFJavaVariables) : string[] {
    const variables : string[] = []
    for (const variable of emfJavaVariables.variables) {
      variables.push(variable.name)
    }

    return variables
  }

  private toGlobalConditions(emfConditions : EMFConditions | null) : ConditionDTO[] {
    const conditions : ConditionDTO[] = []
    if (!emfConditions) { return conditions }
    if (!emfConditions.conditions) { return conditions}
    for (const condition of emfConditions.conditions) {
      conditions.push(this.toConditon(condition))
    }
    return conditions
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
