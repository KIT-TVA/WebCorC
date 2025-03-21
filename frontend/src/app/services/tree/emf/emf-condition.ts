/**
 * EMF json compatible array of EMFConditions.
 * @see EMFCondition
 */
export interface EMFConditions {
    type : string
    conditions : EMFCondition[]
}

/**
 * Default implemtation of EMFConditions.
 * @see EMFConditions
 */
export class GlobalEMFConditions implements EMFConditions {
    
    constructor(
        public type : string = "GlobalConditions",
        public conditions : EMFCondition[] = []
    ){}
}

/**
 * EMF json compatible presentation of a conditon
 * @see Condition
 */
export interface EMFCondition {
    name : string
}