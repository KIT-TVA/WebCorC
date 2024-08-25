
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Statement } from "./statement";

export class SimpleStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public statement : Statement | undefined

    ) {
        super(name, "simple", id, proven, comment, preCondition, postCondition, position)
    }
}