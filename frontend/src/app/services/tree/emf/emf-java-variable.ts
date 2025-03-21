/**
 * EMF json compatible array of EMFVariable variables.
 * @see EMFVariable
 */
export interface EMFVariables {
    type : string 
    variables: EMFVariable[]
}

/**
 * Default implementation of EMFVariables.
 * @see EMFJavaVariables
 */
export class EMFJavaVariables implements EMFVariables {

    constructor(public type : string = "JavaVariables", public variables : EMFVariable[] = [] ) {}
}

/**
 * EMF json compatible presentation of a java variable.
 */
export interface EMFVariable {
    name : string
}