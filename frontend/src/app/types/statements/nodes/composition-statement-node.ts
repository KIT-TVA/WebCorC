import {AbstractStatementNode, createStatementNode} from "./abstract-statement-node";
import {ICompositionStatement} from "../composition-statement";
import {ICondition} from "../../condition/condition";
import {signal, Signal} from "@angular/core";

export class CompositionStatementNode extends AbstractStatementNode {
    public intermediateCondition: Signal<ICondition>
    public firstStatementNode: AbstractStatementNode | undefined
    public secondStatementNode: AbstractStatementNode | undefined

    constructor(
        statement: ICompositionStatement,
        parent: AbstractStatementNode | undefined
    ) {
        super(statement, parent)
        this.intermediateCondition = signal(statement.intermediateCondition)
        if (statement.firstStatement) {
            this.firstStatementNode = createStatementNode(statement.firstStatement, this)
            this.children.push(this.firstStatementNode)
            this.firstStatementNode.overridePrecondition(this, this.precondition)
        }
        if (statement.secondStatement) {
            this.secondStatementNode = createStatementNode(statement.secondStatement, this)
            this.children.push(this.secondStatementNode)
            this.secondStatementNode.overridePrecondition(this, this.intermediateCondition)
        }
    }

    override overridePrecondition(sourceNode: AbstractStatementNode, condition: Signal<ICondition>) {
        super.overridePrecondition(sourceNode, condition);
        this.firstStatementNode?.overridePrecondition(this, condition)
    }

    override overridePostcondition(sourceNode: AbstractStatementNode, condition: Signal<ICondition>) {
        switch (sourceNode) {
            case this.firstStatementNode:
                this.intermediateCondition = condition
                break
            case this.secondStatementNode:
                this.postcondition = condition
                break
            default:
                // Should never happen
        }
    }
}