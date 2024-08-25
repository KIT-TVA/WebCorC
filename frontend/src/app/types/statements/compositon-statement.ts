import { Condition } from "../condition/condition";
import { Postcondition } from "../condition/postcondition";
import { Precondition } from "../condition/precondition";
import { Position } from "../position";
import { Statement } from "./statement";

export class CompositionStatement extends Statement {


    constructor(
        name : string,
        id : number,
        proven : boolean,
        comment : string,
        preCondition : Precondition,
        postCondition : Postcondition,
        position : Position,
        public intermediateCondition : Condition,
        public leftStatement : Statement,
        public rightStatement : Statement,
    ) {
        super(name, "composition" ,id, proven, comment, preCondition, postCondition, position)
    }
}