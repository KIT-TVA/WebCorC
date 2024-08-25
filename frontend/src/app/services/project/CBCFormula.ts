import { Condition } from "../../types/condition/condition";
import { Refinement } from "../../types/refinement";
import { Statement } from "../../types/statements/statement";

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