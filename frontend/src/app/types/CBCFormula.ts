import { Condition, ICondition } from "./condition/condition";
import { IPosition, Position } from "./position";
import {
  IAbstractStatement,
  IAbstractStatementImpl,
  IVerifiers,
} from "./statements/abstract-statement";
import { IJavaVariable } from "./JavaVariable";
import { IRenaming } from "./Renaming";
import { IRootStatement, RootStatement } from "./statements/root-statement";

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for communication with the backend.
 */
export interface ICBCFormula {
  name: string;
  statement: IAbstractStatementImpl | undefined;
  preCondition: ICondition;
  postCondition: ICondition;
  /**
   * The root statement's per-verifier conditions and results; same shape and rules as
   * {@link IAbstractStatement.verifiers} (see {@link IVerifierEntry}).
   */
  verifiers?: IVerifiers;
  javaVariables: IJavaVariable[];
  globalConditions: ICondition[];
  renamings: IRenaming[] | null;
  isProven: boolean;
}

export interface ILocalCBCFormula {
  name: string;
  statement: IRootStatement | undefined;
  javaVariables: IJavaVariable[];
  globalConditions: ICondition[];
  renamings: IRenaming[] | null;
  isProven: boolean;
  readonly local: true;
}

export class LocalCBCFormula implements ILocalCBCFormula {
  public readonly local = true;
  constructor(
    public name: string = "",
    public statement: IRootStatement | undefined = new RootStatement(
      "",
      new Condition(""),
      new Condition(""),
      undefined,
    ),
    public javaVariables: IJavaVariable[] = [],
    public globalConditions: ICondition[] = [],
    public renamings: IRenaming[] | null = null,
    public isProven: boolean = false,
    public position: IPosition = new Position(0, 0),
  ) {}

  /** Serialize with the statement tree last, keeping the scalar fields readable. */
  public toJSON(): Record<string, unknown> {
    return {
      local: this.local,
      name: this.name,
      javaVariables: this.javaVariables,
      globalConditions: this.globalConditions,
      renamings: this.renamings,
      isProven: this.isProven,
      position: this.position,
      statement: this.statement,
    };
  }
}

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for saving state.
 */
export class CBCFormula implements ICBCFormula {
  constructor(
    public name: string = "",
    public statement: IAbstractStatement | undefined = new RootStatement(
      "",
      new Condition(""),
      new Condition(""),
      undefined,
    ),
    public preCondition: ICondition = new Condition(""),
    public postCondition: ICondition = new Condition(""),
    public javaVariables: IJavaVariable[] = [],
    public globalConditions: ICondition[] = [],
    public renamings: IRenaming[] | null = null,
    public isProven: boolean = false,
    public position: IPosition = new Position(0, 0),
    public verifiers: IVerifiers = {},
  ) {}

  /** Serialize with the statement tree last, keeping the scalar fields readable. */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      preCondition: this.preCondition,
      postCondition: this.postCondition,
      verifiers: this.verifiers,
      javaVariables: this.javaVariables,
      globalConditions: this.globalConditions,
      renamings: this.renamings,
      isProven: this.isProven,
      position: this.position,
      statement: this.statement,
    };
  }
}
