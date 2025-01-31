import { Renaming } from "../Renaming";
import { EMFCondition, EMFConditions } from "./emf-condition";
import { EMFJavaVariables } from "./emf-java-variable";
import { EMFRenaming } from "./emf-renaming";
import { EMFStatement } from "./emf-statement";

export interface EMFCbcFormula {
    type : string,
    name : string,
    proven : boolean,
    comment: string,
    compositionTechnique : string,
    className : string,
    methodName : string,
    tested : boolean,
    javaVariables : EMFJavaVariables,
    globalConditions : EMFConditions | null,
    preCondition : EMFCondition,
    postCondition : EMFCondition,
    statement : EMFStatement | undefined
    renaming : EMFRenaming | null
}