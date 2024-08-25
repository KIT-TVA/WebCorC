import { ViewContainerRef } from "@angular/core";
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Refinement } from "../refinement";

export class Statement {

    constructor(
        public name : string,
        public statementType : string,
        public id : number,
        public proven : boolean,
        public comment : string,
        public preCondition : Precondition,
        public postCondition : Postcondition,
        public position : Position 
    ) {}


    public toComponent(spawn : ViewContainerRef) : Refinement | undefined {
        return
    }
}