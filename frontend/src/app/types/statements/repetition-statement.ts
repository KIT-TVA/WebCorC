import {AbstractStatement, IAbstractStatement} from "./abstract-statement";
import {ICondition} from "../condition/condition";
import {IPosition, Position} from "../position";

/**
 * Data only representation of {@link RepetitionStatementComponent}
 * Compatible with the api calls.
 */
export interface IRepetitionStatement extends IAbstractStatement {
    isPostProven: boolean
    isPreProven: boolean
    isVariantProven: boolean
    invariant: ICondition
    variant: ICondition
    guard: ICondition
    loopStatement: IAbstractStatement | undefined
}


/**
 * Data only representation of {@link RepetitionStatementComponent}
 * @see IRepetitionStatement
 */
export class RepetitionStatement extends AbstractStatement implements IRepetitionStatement {

    public static readonly TYPE = "REPETITION"

    constructor(
        name: string,
        preCondition: ICondition,
        postCondition: ICondition,
        public loopStatement: IAbstractStatement | undefined,
        public variant: ICondition,
        public invariant: ICondition,
        public guard: ICondition,
        public isVariantProven: boolean,
        public isPreProven: boolean,
        public isPostProven: boolean,
        position: IPosition = new Position(0, 0)
    ) {
        super(name, RepetitionStatement.TYPE, preCondition, postCondition, position)
    }
}