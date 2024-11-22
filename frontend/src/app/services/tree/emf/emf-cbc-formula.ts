import { EMFCondition } from "./emf-condition";
import { EMFJavaVariable } from "./emf-java-variable";
import { EMFStatement } from "./emf-statement";

export interface EMFCbcFormula {
    type : string,
    name : string,
    proven : boolean,
    comment: string,
    compositionTechnique : string,
    className : string,
    methodName : string,
    javaVariables : EMFJavaVariable[],
    globalConditions : EMFCondition[],
    preCondition : EMFCondition,
    postCondition : EMFCondition,
    statement : EMFStatement | undefined
}