import { ConditionDTO, IConditionDTO } from "../../types/condition/condition";
import { Position } from "../../types/position";
import { IStatement, Statement } from "../../types/statements/statement";

export interface ICBCFormula {
    type : string
    name : string
    proven : boolean
    comment : string
    compositionTechnique : string
    className : string 
    methodName : string
    tested : boolean
    javaVariables : string[]
    globalConditions : IConditionDTO[] 
    preCondition : IConditionDTO
    postCondition : IConditionDTO
    statement : IStatement | undefined
}

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for saving state and communicate with the backend.
 */
export class CBCFormula implements ICBCFormula {

    constructor(
        public type : string = "CbCFormula",  
        public name : string = "",
        public proven : boolean = false,
        public comment : string = "",
        public compositionTechnique : string = "CONTRACT_OVERRIDING",
        public className : string = "",
        public methodName : string = "",
        public tested : boolean = false,
        public javaVariables : string[] = [],
        public globalConditions : ConditionDTO[] = [],
        public preCondition : ConditionDTO = new ConditionDTO(1),
        public postCondition : ConditionDTO = new ConditionDTO(1),
        public statement : Statement | undefined = undefined,
        public position : Position = new Position(0,0)
    ) {}
}

