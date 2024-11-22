import { ConditionDTO } from "../../../types/condition/condition";
import { CompositionStatement } from "../../../types/statements/compositon-statement";
import { RepetitionStatement } from "../../../types/statements/repetition-statement";
import { SelectionStatement } from "../../../types/statements/selection-statement";
import { SimpleStatement } from "../../../types/statements/simple-statement";
import { Statement } from "../../../types/statements/statement";
import { StrongWeakStatement } from "../../../types/statements/strong-weak-statement";
import { CBCFormula } from "../../project/CBCFormula";
import { EMFCbcFormula } from "./emf-cbc-formula";
import { EMFCondition } from "./emf-condition";
import { EMFJavaVariable } from "./emf-java-variable";
import { EMFStatement, EMFSimpleStatement, EMFSelectionStatement, EMFRepetitionStatement, EMFCompositionStatement, EMFStrongWeakStatement } from "./emf-statement";

export function toCBCFormula(emfCbcFormula : EMFCbcFormula) : CBCFormula {

    return new CBCFormula(
      emfCbcFormula.type,
      emfCbcFormula.name,
      emfCbcFormula.proven,
      emfCbcFormula.comment,
      emfCbcFormula.compositionTechnique,
      emfCbcFormula.className,
      emfCbcFormula.methodName,
      toVariables(emfCbcFormula.javaVariables),
      toGlobalConditions(emfCbcFormula.globalConditions),
      toConditon(emfCbcFormula.preCondition),
      toConditon(emfCbcFormula.postCondition),
      toStatement(emfCbcFormula.statement)
    )
}

export function toEMFCbcFormula(cbcFormula : CBCFormula) : EMFCbcFormula {
    return {
      type : cbcFormula.type,
      name : cbcFormula.name,
      proven : cbcFormula.proven,
      comment : cbcFormula.comment,
      compositionTechnique : cbcFormula.compositionTechnique,
      className : cbcFormula.className,
      methodName : cbcFormula.methodName,
      javaVariables : toEMFJavaVariables(cbcFormula.javaVariables),
      globalConditions : toEMFGlobalConditions(cbcFormula.globalConditions),
      preCondition : toEMFCondition(cbcFormula.preCondition),
      postCondition : toEMFCondition(cbcFormula.postCondition),
      statement : toEMFStatement(cbcFormula.statement)
    }
}

export function toEMFStatement(statement : Statement | null | undefined) : EMFStatement | undefined {
    if (!statement) return

    switch (statement.type) {
      case SimpleStatement.TYPE:
        return {
          name : statement.name,
          type : statement.type,
          id : statement.id,
          proven : statement.proven,
          comment : statement.comment,
          preCondition : toEMFCondition(statement.preCondition),
          postCondition : toEMFCondition(statement.postCondition),
          refinement : toEMFStatement((statement as SimpleStatement).refinement)
        } as EMFSimpleStatement

      case SelectionStatement.TYPE:
        var childs : (EMFStatement | undefined)[] = []
        for (var child of (statement as SelectionStatement).commands) {
          childs.push(
            toEMFStatement(child)
          )
        }

        var guards : EMFCondition[] = []
        for (var guard of (statement as SelectionStatement).guards) {
          guards.push(
            toEMFCondition(guard)
          )
        }
        return {
          name : statement.name,
          type : statement.type,
          id : statement.id,
          proven : statement.proven,
          comment : statement.comment,
          preCondition : toEMFCondition(statement.preCondition),
          postCondition : toEMFCondition(statement.postCondition),
          preProven : (statement as SelectionStatement).preProven,
          guards : guards,
          commands : childs
        } as EMFSelectionStatement

      case RepetitionStatement.TYPE:
        return {
          name : statement.name,
          type : statement.type,
          id : statement.id,
          proven : statement.proven,
          comment : statement.comment,
          preCondition : toEMFCondition(statement.preCondition),
          postCondition : toEMFCondition(statement.postCondition),
          postProven : (statement as RepetitionStatement).postProven,
          preProven : (statement as RepetitionStatement).preProven,
          variantProven : (statement as RepetitionStatement).variantProven,
          invariant : toEMFCondition((statement as RepetitionStatement).invariant),
          variant : toEMFCondition((statement as RepetitionStatement).variant),
          guard : toEMFCondition((statement as RepetitionStatement).guard),
          loopStatement : toEMFStatement((statement as RepetitionStatement).loopStatement)
        } as EMFRepetitionStatement

      case CompositionStatement.TYPE:
        return {
          name : statement.name,
          type : statement.type,
          id : statement.id,
          proven : statement.proven,
          comment : statement.comment,
          preCondition : toEMFCondition(statement.preCondition),
          postCondition : toEMFCondition(statement.postCondition),
          intermediateCondition : toEMFCondition((statement as CompositionStatement).intermediateCondition),
          firstStatement : toEMFStatement((statement as CompositionStatement).firstStatement),
          secondStatement : toEMFStatement((statement as CompositionStatement).secondStatement)
        } as EMFCompositionStatement

        case StrongWeakStatement.TYPE:
          return {
            name : statement.name,
            type : statement.type,
            id : statement.id,
            proven : statement.proven,
            comment : statement.comment,
            preCondition : toEMFCondition(statement.preCondition),
            postCondition : toEMFCondition(statement.postCondition),
            refinement : toEMFStatement((statement as SimpleStatement).refinement)
          } as EMFStrongWeakStatement
    }

    return
} 

function toEMFGlobalConditions(conditions : ConditionDTO[]) : EMFCondition[] {
    const emfCondtions : EMFCondition[] = []
    for (const condition of conditions) {
      emfCondtions.push(
        toEMFCondition(condition)
      )
    }

    return emfCondtions
}


function toEMFCondition(condition : ConditionDTO) : EMFCondition {
    return { name : condition.content }
}


function toEMFJavaVariables(javaVariables : string[]) : EMFJavaVariable[] {
    const variables : EMFJavaVariable[] = []
    for (const variable of javaVariables) {
      variables.push(
        toEMFVariable(variable)
      )
    }

    return variables
}

function toEMFVariable(javaVariable : string) : EMFJavaVariable {
    return { name : javaVariable }
}

function toStatement(emfStatement : EMFStatement | undefined) : Statement | undefined {
    if (!emfStatement) {
      return
    }

    switch (emfStatement.type) {
      case SimpleStatement.TYPE:
        return new SimpleStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.comment,
          toConditon(emfStatement.preCondition),
          toConditon(emfStatement.postCondition),
          undefined,
          toStatement((emfStatement as EMFSimpleStatement).refinement)
        )
      
      case SelectionStatement.TYPE: 
        var childs : (Statement | undefined)[] = []
        for (var child of (emfStatement as EMFSelectionStatement).commands) {
          childs.push(
            toStatement(child)
          )
        }

        var guards : ConditionDTO[] = []
        for (var guard of (emfStatement as EMFSelectionStatement).guards) {
          guards.push(
            toConditon(guard)
          )
        }

        return new SelectionStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.comment,
          toConditon(emfStatement.preCondition),
          toConditon(emfStatement.postCondition),
          undefined,
          (emfStatement as EMFSelectionStatement).preProven,
          guards,
          childs
        )
      
      case RepetitionStatement.TYPE:
        return new RepetitionStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.comment,
          toConditon(emfStatement.preCondition),
          toConditon(emfStatement.postCondition),
          undefined,
          (emfStatement as EMFRepetitionStatement).postProven,
          (emfStatement as EMFRepetitionStatement).preProven,
          (emfStatement as EMFRepetitionStatement).variantProven,
          toConditon((emfStatement as EMFRepetitionStatement).invariant),
          toConditon((emfStatement as EMFRepetitionStatement).variant),
          toConditon((emfStatement as EMFRepetitionStatement).guard),
          toStatement((emfStatement as EMFRepetitionStatement).loopStatement)
        )

      case CompositionStatement.TYPE:
        return new CompositionStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.comment,
          toConditon(emfStatement.preCondition),
          toConditon(emfStatement.postCondition),
          undefined,
          toConditon((emfStatement as EMFCompositionStatement).intermediateCondition),
          toStatement((emfStatement as EMFCompositionStatement).firstStatement),
          toStatement((emfStatement as EMFCompositionStatement).secondStatement),
        )

      case StrongWeakStatement.TYPE:
        return new StrongWeakStatement(
          emfStatement.name,
          emfStatement.id,
          emfStatement.proven,
          emfStatement.comment,
          toConditon(emfStatement.preCondition),
          toConditon(emfStatement.postCondition),
          undefined,
          toStatement((emfStatement as EMFStrongWeakStatement).refinement)
        )
    }

    return
}

function toConditon(emfCondition : EMFCondition) : ConditionDTO {
    return new ConditionDTO(0, "", emfCondition.name)
}


function toVariables(emfJavaVariables : EMFJavaVariable[]) : string[] {
    const variables : string[] = []
    for (const variable of emfJavaVariables) {
      variables.push(variable.name)
    }

    return variables
}

function toGlobalConditions(emfConditions : EMFCondition[]) : ConditionDTO[] {
    const conditions : ConditionDTO[] = []
    for (const condition of emfConditions) {
      conditions.push(toConditon(condition))
    }
    return conditions
}