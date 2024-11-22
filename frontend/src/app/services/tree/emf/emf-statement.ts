import { EMFCondition } from "./emf-condition";

export interface EMFStatement {
    name : string
    type : string
    id : number
    proven : boolean
    comment : string
    preCondition : EMFCondition
    postCondition : EMFCondition
}

export interface EMFSimpleStatement extends EMFStatement {
    refinement : EMFStatement | undefined
}

export interface EMFSelectionStatement extends EMFStatement {
    preProven : boolean
    guards : EMFCondition[]
    commands : (EMFStatement | undefined)[]
}

export interface EMFRepetitionStatement extends EMFStatement {
    postProven : boolean
    preProven : boolean
    variantProven : boolean
    invariant : EMFCondition
    variant : EMFCondition
    guard : EMFCondition
    loopStatement : EMFStatement | undefined
}

export interface EMFCompositionStatement extends EMFStatement {
    intermediateCondition : EMFCondition
    firstStatement : EMFStatement
    secondStatement: EMFStatement
}

export interface EMFStrongWeakStatement extends EMFStatement {
    refinement : EMFStatement
}