import {Signal, signal} from "@angular/core";
import {ICondition} from "../../condition/condition";
import {IAbstractStatement} from "../abstract-statement";
import {CompositionStatementNode} from "./composition-statement-node";
import {ICompositionStatement} from "../composition-statement";
import {RepetitionStatementNode} from "./repetition-statement-node";
import {IRepetitionStatement} from "../repetition-statement";
import {SelectionStatementNode} from "./selection-statement-node";
import {ISelectionStatement} from "../selection-statement";
import {SkipStatementNode} from "./skip-statement-node";
import {SimpleStatementNode} from "./simple-statement-node";
import {IStatement} from "../simple-statement";

export function createStatementNode(statement: IAbstractStatement, parent?: AbstractStatementNode) {
    switch (statement.type) {
        case "COMPOSITION":
            return new CompositionStatementNode(statement as ICompositionStatement, parent)
        case "REPETITION":
            return new RepetitionStatementNode(statement as IRepetitionStatement, parent)
        case "SELECTION":
            return new SelectionStatementNode(statement as ISelectionStatement, parent)
        case "SKIP":
            return new SkipStatementNode(statement as ISelectionStatement, parent)
        case "STATEMENT":
            return new SimpleStatementNode(statement as IStatement, parent)
        default:
            return new AbstractStatementNode(statement, parent)
    }
}

export class AbstractStatementNode {
    public statement: IAbstractStatement;
    public parent: AbstractStatementNode | undefined;
    public children: (AbstractStatementNode | undefined)[] = [];
    public precondition: Signal<ICondition>;
    public postcondition: Signal<ICondition>;
    public preconditionEditable = signal(true)
    public postconditionEditable = signal(true)

    constructor(
        statement: IAbstractStatement,
        parent: AbstractStatementNode | undefined
    ) {
        this.statement = statement
        this.parent = parent
        this.precondition = signal(statement.preCondition)
        this.postcondition = signal(statement.preCondition)
    }

    public overridePrecondition(sourceNode: AbstractStatementNode, condition: Signal<ICondition>): void {
        this.precondition = condition
    };

    public overridePostcondition(sourceNode: AbstractStatementNode, condition: Signal<ICondition>): void {
        this.postcondition = condition
    }
}