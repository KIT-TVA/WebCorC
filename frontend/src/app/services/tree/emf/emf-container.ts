import { EMFCbcFormula } from "./emf-cbc-formula"
import { EMFCondition} from "./emf-condition"
import {EMFVariable } from "./emf-java-variable"
import { EMFRename } from "./emf-renaming"

/**
 * A container for a CBCFormula, the java varibales, renamings and the global conditions
 * @see CBCFormula
 */
export interface BCbCContainer {
    cbcFormula: EMFCbcFormula
    javaVariables: EMFVariable[],
    globalConditions: EMFCondition[] 
    renamings: EMFRename[] 
}