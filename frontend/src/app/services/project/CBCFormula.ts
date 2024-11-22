import { ConditionDTO, IConditionDTO } from "../../types/condition/condition";
import { IStatement, Statement } from "../../types/statements/statement";
import { importStatementsfromJSON } from "./util";

export interface ICBCFormula {
    type : string
    name : string
    proven : boolean
    comment : string
    compositionTechnique : string
    className : string 
    methodName : string
    javaVariables : string[]
    globalConditions : IConditionDTO[]
    preCondition : IConditionDTO
    postCondition : IConditionDTO
    statement : IStatement | null 
}

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for saving state and communicate with the backend.
 */
export class CBCFormula implements ICBCFormula {

    constructor(
        public type : string = "CBCFormula",  
        public name : string = "",
        public proven : boolean = false,
        public comment : string = "",
        public compositionTechnique : string = "CONTRACT_OVERRIDING",
        public className : string = "",
        public methodName : string = "",
        public javaVariables : string[] = [],
        public globalConditions : ConditionDTO[]  = [],
        public preCondition : ConditionDTO = new ConditionDTO(1),
        public postCondition : ConditionDTO = new ConditionDTO(1),
        public statement : Statement | null = null
    ) {}


    public import() {
        if (!this.statement) return

        let statement = importStatementsfromJSON(this.statement)

        this.statement = statement ? statement : null
    }
}

