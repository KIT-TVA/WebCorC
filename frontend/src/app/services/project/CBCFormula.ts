import { ConditionDTO } from "../../types/condition/condition";
import { SimpleStatement } from "../../types/statements/simple-statement";
import { Statement, importStatementsfromJSON } from "../../types/statements/statement";

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
        console.log("import formula")
        let statement : Statement | undefined

        if (this.statement) {
            statement = importStatementsfromJSON(this.statement)
            this.statement = statement ? statement : null
        }

        return new CBCFormula(
            this.type,
            this.name,
            this.proven,
            this.comment,
            this.compositionTechnique,
            this.className,
            this.methodName,
            this.javaVariables,
            this.globalConditions,
            this.preCondition,
            this.postCondition,
            statement
        )
    }
}