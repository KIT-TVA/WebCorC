import { Condition } from "../condition/condition";
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Statement } from "./statement";

export class SelectionStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public preProven : boolean,
        public guards : Condition[],
        public statements : Statement[]
    ) {
        super(name, "selection", id, proven, comment, preCondition, postCondition, position)
    }
}