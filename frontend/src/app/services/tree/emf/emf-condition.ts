export interface EMFConditions {
    type : string
    conditions : EMFCondition[]
}

export class GlobalEMFConditions implements EMFConditions {
    
    constructor(
        public type : string = "GlobalConditions",
        public conditions : EMFCondition[] = []
    ){}
}

export interface EMFCondition {
    name : string
}