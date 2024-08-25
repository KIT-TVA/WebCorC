import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Statement } from "./statement";

export class StrongWeakStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public statement : Statement

    ) {
        super(name, "strongWeak", id, proven, comment, preCondition, postCondition, position)
    }
}