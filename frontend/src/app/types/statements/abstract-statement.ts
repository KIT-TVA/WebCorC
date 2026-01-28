import { IPosition, Position } from "../position";
import { ICondition } from "../condition/condition";
import { IStatement } from "./simple-statement";
import { ICompositionStatement } from "./composition-statement";
import { IRepetitionStatement } from "./repetition-statement";
import { ISkipStatement } from "./strong-weak-statement";
import { ISelectionStatement } from "./selection-statement";

export type IAbstractStatementImpl =
  | IStatement
  | ICompositionStatement
  | IRepetitionStatement
  | ISkipStatement
  | ISelectionStatement;
export type StatementType =
  | "ROOT"
  | "STATEMENT"
  | "COMPOSITION"
  | "RETURN"
  | "SELECTION"
  | "SKIP"
  | "REPETITION";

/**
 * Data only representation of the statements edited in the editor
 */
export interface IAbstractStatement {
  id: string;
  name: string;
  type:
    | "STATEMENT"
    | "COMPOSITION"
    | "RETURN"
    | "SELECTION"
    | "SKIP"
    | "REPETITION"
    | "ROOT";
  preCondition: ICondition;
  postCondition: ICondition;
  isProven: boolean;
  position?: IPosition;
}

/**
 * Data only representation of the statements edited in the editor.
 * @see IAbstractStatement
 */
export class AbstractStatement implements IAbstractStatement {
  public readonly id: string;
  public isProven = false;
  constructor(
    public name: string,
    public type:
      | "STATEMENT"
      | "COMPOSITION"
      | "RETURN"
      | "SELECTION"
      | "SKIP"
      | "REPETITION"
      | "ROOT",
    public preCondition: ICondition,
    public postCondition: ICondition,
    public position: IPosition = new Position(0, 0),
  ) {
    this.id = String(Date.now() * Math.random());
  }
}
