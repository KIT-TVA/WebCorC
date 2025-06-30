import {ICompositionStatement} from "../composition-statement";
import {ICondition} from "../../condition/condition";
import {signal, WritableSignal} from "@angular/core";
import {AbstractStatementNode} from "./abstract-statement-node";
import {createStatementNode} from "./createStatementNode";

export class CompositionStatementNode extends AbstractStatementNode {
    public intermediateCondition: WritableSignal<ICondition>
    override statement!: ICompositionStatement
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

    override overridePrecondition(sourceNode: AbstractStatementNode, condition: WritableSignal<ICondition>) {
        super.overridePrecondition(sourceNode, condition);
        this.firstStatementNode?.overridePrecondition(this, condition)
    }

    override overridePostcondition(sourceNode: AbstractStatementNode, condition: WritableSignal<ICondition>) {
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