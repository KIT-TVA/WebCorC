import { AbstractStatement, IAbstractStatement } from "./abstract-statement";
import { ICondition } from "../condition/condition";
import { IPosition, Position } from "../position";

export interface IRootStatement extends IAbstractStatement {
  statement: IAbstractStatement | undefined;
}

/**
 * Data only representation of {@link SimpleStatementComponent}
 * @see ISimpleStatement
 */
export class RootStatement extends AbstractStatement implements IRootStatement {
  public static readonly TYPE = "ROOT";

  constructor(
    name: string,
    preCondition: ICondition,
    postCondition: ICondition,
    public statement: IAbstractStatement | undefined,
    position: IPosition = new Position(0, 0),
  ) {
    super(name, RootStatement.TYPE, preCondition, postCondition, position);
  }
}
