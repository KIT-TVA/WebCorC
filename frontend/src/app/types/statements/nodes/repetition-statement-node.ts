import {AbstractStatementNode, createStatementNode} from "./abstract-statement-node";
import {IRepetitionStatement} from "../repetition-statement";
import {signal, Signal} from "@angular/core";
import {ICondition} from "../../condition/condition";

export class RepetitionStatementNode extends AbstractStatementNode {
    public loopStatementNode: AbstractStatementNode | undefined
    public guard: Signal<ICondition>
    constructor(
        statement: IRepetitionStatement,
        parent: AbstractStatementNode | undefined
    ) {
        super(statement, parent);
        this.guard = signal(statement.guard)
        if (statement.loopStatement) {
            this.loopStatementNode = createStatementNode(statement.loopStatement, this)
            this.children.push(this.loopStatementNode)
            this.loopStatementNode.overridePrecondition(this, this.precondition) //TODO: Compute guard && precondition
            // How its done in Component:
            //       super.precondition.content = "((" + this._invariantCondition.content + ") & (" + this._guardCondition.content + "))"
        }
    }

    public override overridePrecondition(sourceNode: AbstractStatementNode, condition: Signal<ICondition>) {
        super.overridePrecondition(sourceNode, condition);
        this.loopStatementNode?.overridePrecondition(this, condition) //TODO: Compute guard && precondition
    }

    public override overridePostcondition(sourceNode: AbstractStatementNode, condition: Signal<ICondition>) {
        super.overridePostcondition(sourceNode, condition);
        this.parent?.overridePostcondition(this, condition) //TODO Compute postcondition && ¬guard
    }
}