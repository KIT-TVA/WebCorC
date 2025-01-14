import { ComponentRef, ViewContainerRef } from "@angular/core";
import { IPosition, Position } from "../position";
import { Refinement } from "../refinement";
import { ConditionDTO, IConditionDTO } from "../condition/condition";

export interface IStatement {
    name : string
    type : string
    id : number
    proven : boolean
    tested: boolean
    comment : string
    preCondition : IConditionDTO
    postCondition : IConditionDTO
    position : IPosition
}


export class Statement implements IStatement {

    constructor(
        public name : string,
        public type : string,
        public id : number,
        public proven : boolean,
        public tested : boolean,
        public comment : string,
        public preCondition : ConditionDTO,
        public postCondition : ConditionDTO,
        public position : Position 
    ) {}

    /**
     * Convert the data only statement to the corresponding component 
     * @param spawn The element to spawn the component in
     * @returns The raw statment and the component reference of the statement, used to connect the statements in the graphical editor
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public toComponent(spawn : ViewContainerRef) : [ refinement : Refinement, ref : ComponentRef<Refinement>] | undefined {
        return
    }
}