
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Statement } from "./statement";
import { Condition } from "../condition/condition";
import { Position } from "../position";

export class RepetitionStatement extends Statement {

    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public postProven : boolean,
        public preProven : boolean,
        public variantProven : boolean,
        public invariantCondition : Condition,
        public variant : Condition,
        public guardCondition : Condition,
        public loopStatement : Statement

    ) {
        super(name, "repetition", id, proven, comment, preCondition, postCondition, position)
    }
}