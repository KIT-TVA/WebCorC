import {Condition, ICondition} from "./condition/condition";
import {IPosition, Position} from "./position";
import {IAbstractStatement, IAbstractStatementImpl} from "./statements/abstract-statement";
import {IJavaVariable} from "./JavaVariable";
import {IRenaming} from "./Renaming";

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for communication with the backend.
 */
export interface ICBCFormula {
    name: string
    statement: IAbstractStatementImpl | undefined
    preCondition: ICondition
    postCondition: ICondition
    javaVariables: IJavaVariable[]
    globalConditions: ICondition[]
    renamings: IRenaming[] | null
    isProven: boolean
}

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for saving state.
 */
export class CBCFormula implements ICBCFormula {

    constructor(
        public name: string = "",
        public statement: IAbstractStatement | undefined = undefined,
        public preCondition: ICondition = new Condition(""),
        public postCondition: ICondition = new Condition(""),
        public javaVariables: IJavaVariable[] = [],
        public globalConditions: ICondition[] = [],
        public renamings: IRenaming[] | null = null,
        public isProven: boolean = false,
        public position: IPosition = new Position(0, 0),
    ) {
    }
}

