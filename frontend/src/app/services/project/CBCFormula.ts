import { Condition } from "../../types/condition/condition";
import { Statement } from "../../types/statements/statement";

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for saving state and communicate with the backend.
 */
export class CBCFormula {

    constructor(
        public type : string = "CBCFormula",  
        public name : string = "",
        public proven : boolean = false,
        public comment : string = "",
        public compositionTechnique : string = "CONTRACT_OVERRIDING",
        public className : string = "",
        public methodName : string = "",
        public javaVariables : string[] = [],
        public globalConditions : Condition[]  = [],
        public preCondition : Condition = new Condition(1),
        public postCondition : Condition = new Condition(1),
        public statement : Statement | null = null
    ) {}
}