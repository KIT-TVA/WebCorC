import {ICondition} from "../condition/condition";
import {IPosition, Position} from "../position";
import {AbstractStatement, IAbstractStatement} from "./abstract-statement";

/**
 * Data only representation of {@link SelectionStatementComponent}.
 * Compatible with the api calls.
 */
export interface ISelectionStatement extends IAbstractStatement {
    isPreProven: boolean
    guards: ICondition[]
    commands: (IAbstractStatement | undefined)[]
}


/**
 * Data only representation of {@link SelectionStatementComponent}
 * @see ISelectionStatement
 */
export class SelectionStatement extends AbstractStatement implements ISelectionStatement {

    public static readonly TYPE = "SELECTION"

    constructor(
        name: string,
        preCondition: ICondition,
        postCondition: ICondition,
        public guards: ICondition[] = [],
        public commands: (IAbstractStatement | undefined)[] = [],
        public isPreProven: boolean,
        position: IPosition = new Position(0, 0),
    ) {
        super(name, SelectionStatement.TYPE, preCondition, postCondition, position)
    }

}