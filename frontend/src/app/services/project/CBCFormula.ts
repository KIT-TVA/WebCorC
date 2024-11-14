import { ConditionDTO } from "../../types/condition/condition";
import { CompositionStatement } from "../../types/statements/compositon-statement";
import { RepetitionStatement } from "../../types/statements/repetition-statement";
import { SelectionStatement } from "../../types/statements/selection-statement";
import { SimpleStatement } from "../../types/statements/simple-statement";
import { Statement } from "../../types/statements/statement";
import { StrongWeakStatement } from "../../types/statements/strong-weak-statement";
import { importStatementsfromJSON } from "./util";

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

