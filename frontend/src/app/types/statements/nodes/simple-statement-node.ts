import {AbstractStatementNode} from "./abstract-statement-node";
import {IStatement} from "../simple-statement";
import {Signal} from "@angular/core";
import {ICondition} from "../../condition/condition";

export class SimpleStatementNode extends AbstractStatementNode {
    override statement!: IStatement
    constructor(statement: IStatement, parent: AbstractStatementNode | undefined) {
        super(statement, parent)
    }


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override overridePostcondition(sourceNode: AbstractStatementNode, condition: Signal<ICondition>) {
        // Should never be called on a simple statement
    }
}