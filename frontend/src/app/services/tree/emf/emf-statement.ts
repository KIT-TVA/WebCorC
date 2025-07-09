import { EMFCondition } from "./emf-condition";

/**
 * EMF json compatible refinement for communication with the backend. 
 */
export interface EMFRefinement {
    name : string
    type: string
    postCondition : EMFCondition
    preCondition: EMFCondition
    proven : boolean
    tested : boolean
}

/**
 * EMF json compatible statement for communication with the backend.
 * Includes @link EMFRefinement
 */
export interface EMFStatement {
    name : string
    isProven : boolean
    statementType: string
    refinement: EMFRefinement
    preCondition : EMFCondition
    postCondition : EMFCondition
}

/**
 * EMF json compatible simple statement for communiction with the backend.
 * @see EMFStatement
 * @see SimpleStatement
 * @see SimpleStatementComponent
 */
export interface EMFSimpleStatement extends EMFStatement {
    refinement: EMFRefinement   
}

/**
 * EMF json compatible selection refinement for communication with the backend.
 * @see EMFRefinement
 */
export interface EMFSelectionRefinement extends EMFRefinement {
    preProven : boolean
    guards : EMFCondition[]
    commands : (EMFStatement | undefined)[]
}

/**
 * EMF json compatible selection statement for communication with the backend.
 * @see EMFSelectionRefinement
 */
export interface EMFSelectionStatement extends EMFStatement {
    refinement : EMFSelectionRefinement
}

/**
 * EMF json compatible repetition refinement for communication with the backend.
 * @see EMFRefinement
 */
export interface EMFRepetitionRefinement extends EMFRefinement {
    postProven : boolean
    preProven : boolean
    variantProven : boolean
    invariant : EMFCondition
    variant : EMFCondition
    guard : EMFCondition
    loopStatement : EMFStatement | undefined
}

/**
 * EMF json compatible repetition statement for communication with the backend.
 * @see EMFStatement
 */
export interface EMFRepetitionStatement extends EMFStatement {
    refinement : EMFRepetitionRefinement
}

/**
 * EMF json compatible composition refinement for communication with the backend.
 * @see EMFRefinement
 */
export interface EMFCompositionRefinement extends EMFRefinement {
    intermediateCondition : EMFCondition
    firstStatement : EMFStatement
    secondStatement: EMFStatement
}

/**
 * EMF json compatible compositon statement for communication with the backend.
 * @see EMFStatement
 */
export interface EMFCompositionStatement extends EMFStatement {
    refinement : EMFCompositionRefinement
}

/**
 * EMF json compatible strong weak statement for communication with the backend.
 */
export interface EMFStrongWeakStatement extends EMFStatement {
    refinement: EMFRefinement
}