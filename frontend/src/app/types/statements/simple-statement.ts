import {IPosition, Position} from "../position";
import {AbstractStatement, IAbstractStatement} from "./abstract-statement";
import {ICondition} from "../condition/condition";

/**
 * Data only representation of {@link SimpleStatementComponent}
 * Compatible with the api calls.
 */
export interface IStatement extends IAbstractStatement {
    programStatement: string;
}


/**
 * Data only representation of {@link SimpleStatementComponent}
 * @see ISimpleStatement
 */
export class Statement extends AbstractStatement implements IStatement {

    public static readonly TYPE = "STATEMENT"

    constructor(
        name: string,
        preCondition: ICondition,
        postCondition: ICondition,
        public programStatement: string = "",
        position: IPosition = new Position(0, 0)
    ) {
        super(name, Statement.TYPE, preCondition, postCondition, position)
    }
}