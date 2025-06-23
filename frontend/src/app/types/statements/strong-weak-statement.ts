import {IPosition, Position} from "../position";
import {AbstractStatement, IAbstractStatement} from "./abstract-statement";
import {ICondition} from "../condition/condition";

/**
 * Data only representation of {@link StrongWeakStatementComponent}.
 * Compatible with the api calls.
 */
export interface ISkipStatement extends IAbstractStatement {
}

/**
 * Data only representation of {@link StrongWeakStatementComponent}
 * @see ISkipStatement
 */
export class SkipStatement extends AbstractStatement implements ISkipStatement {

    public static readonly TYPE = "SKIP"

    constructor(
        name: string,
        preCondition: ICondition,
        postCondition: ICondition,
        position: IPosition = new Position(0, 0),
    ) {
        super(name, SkipStatement.TYPE, preCondition, postCondition, position)
    }
}