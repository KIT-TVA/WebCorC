import { EMFCondition} from "./emf-condition";
import { EMFStatement } from "./emf-statement";

/**
 * EMF json compatible Cbcformula.
 * @see CBCFormula
 */
export interface EMFCbcFormula {
    name : string
    isProven : boolean
    preCondition : EMFCondition
    postCondition : EMFCondition
    statement : EMFStatement
}