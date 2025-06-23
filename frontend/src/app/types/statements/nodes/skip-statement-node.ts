import {AbstractStatementNode} from "./abstract-statement-node";
import {ISkipStatement} from "../strong-weak-statement";

export class SkipStatementNode extends AbstractStatementNode {
    constructor(statement: ISkipStatement, parent: AbstractStatementNode | undefined) {
        super(statement, parent);
        parent?.overridePostcondition(this, this.postcondition)
    }
}