export interface EMFVariables {
    type : string 
    variables: EMFVariable[]
}

export class EMFJavaVariables implements EMFVariables {

    constructor(public type : string = "JavaVariables", public variables : EMFVariable[] = [] ) {}
}

export interface EMFVariable {
    name : string
}