import { ComponentRef, ViewContainerRef } from "@angular/core";
import { Position } from "../position";
import { Refinement } from "../refinement";
import { ConditionDTO } from "../condition/condition";

export class Statement {

    constructor(
        public name : string,
        public statementType : string,
        public id : number,
        public proven : boolean,
        public comment : string,
        public preCondition : ConditionDTO,
        public postCondition : ConditionDTO,
        public position : Position 
    ) {}


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public toComponent(spawn : ViewContainerRef) : [ refinement : Refinement, ref : ComponentRef<Refinement>] | undefined {
        return
    }
}