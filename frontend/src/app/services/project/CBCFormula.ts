import { ConditionDTO, IConditionDTO } from "../../types/condition/condition";
import { Position } from "../../types/position";
import { IStatement, Statement } from "../../types/statements/statement";
import { Renaming } from "../tree/Renaming";

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for communication with the backend.
 */
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
    renaming : Renaming[] | null
    position : Position
}

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for saving state.
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
        public renaming : Renaming[] | null = null,
        public position : Position = new Position(0,0),
    ) {}
}

