import { EMFCondition } from "./emf-condition";

export interface EMFRefinement {
    name : string
    type: string
    postCondition : EMFCondition
    preCondition: EMFCondition
    proven : boolean
    tested : boolean
}

export interface EMFStatement {
    name : string
    type : string
    id : number
    proven : boolean
    tested: boolean
    comment : string
    refinement: EMFRefinement
    preCondition : EMFCondition
    postCondition : EMFCondition
}

export interface EMFSimpleStatement extends EMFStatement {
    
}

export interface EMFSelectionRefinement extends EMFRefinement {
    preProven : boolean
    guards : EMFCondition[]
    commands : (EMFStatement | undefined)[]
}

export interface EMFSelectionStatement extends EMFStatement {
    refinement : EMFSelectionRefinement
}

export interface EMFRepetitionRefinement extends EMFRefinement {
    postProven : boolean
    preProven : boolean
    variantProven : boolean
    invariant : EMFCondition
    variant : EMFCondition
    guard : EMFCondition
    loopStatement : EMFStatement | undefined
}

export interface EMFRepetitionStatement extends EMFStatement {
    refinement : EMFRepetitionRefinement
}

export interface EMFCompositionRefinement extends EMFRefinement {
    intermediateCondition : EMFCondition
    firstStatement : EMFStatement
    secondStatement: EMFStatement
}

export interface EMFCompositionStatement extends EMFStatement {
    refinement : EMFCompositionRefinement
}

export interface EMFStrongWeakStatement extends EMFStatement {
    
}