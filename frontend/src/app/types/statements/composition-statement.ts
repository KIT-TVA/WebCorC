import {ICondition} from "../condition/condition";
import {IPosition, Position} from "../position";
import {AbstractStatement, IAbstractStatement} from "./abstract-statement";

/**
 * Data only representation of {@link CompositionStatementComponent}.
 * Compatible with the api calls.
 */
export interface ICompositionStatement extends IAbstractStatement {
    intermediateCondition: ICondition
    firstStatement: IAbstractStatement | undefined
    secondStatement: IAbstractStatement | undefined
}

/**
 * Data only representation of {@link CompositionStatementComponent}.
 * @see ICompositionStatement
 */
export class CompositionStatement extends AbstractStatement implements ICompositionStatement {

    public static readonly TYPE = "COMPOSITION"

    constructor(
        name: string,
        preCondition: ICondition,
        postCondition: ICondition,
        public intermediateCondition: ICondition,
        public firstStatement: IAbstractStatement | undefined,
        public secondStatement: IAbstractStatement | undefined,
        position: IPosition = new Position(0, 0),
    ) {
        super(name, CompositionStatement.TYPE, preCondition, postCondition, position)
    }
}