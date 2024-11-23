export interface EMFVariables {
    types : string 
    variables: EMFVariable[]
}

export class EMFJavaVariables implements EMFVariables {

    constructor(public types : string = "JavaVariables", public variables : EMFVariable[] = [] ) {}
}

export interface EMFVariable {
    name : string
}