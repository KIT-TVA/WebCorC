import { Condition, ICondition } from "./condition/condition";
import { IPosition, Position } from "./position";
import {
  IAbstractStatement,
} from "./statements/abstract-statement";
import { IJavaVariable } from "./JavaVariable";
import { IRenaming } from "./Renaming";
import { IRootStatement, RootStatement } from "./statements/root-statement";
import { VariableIFbCState } from "./ifbc/variableState";
import { CBCFormula, ICBCFormula, LocalCBCFormula } from "./CBCFormula";
import { ConfidentialityLattice, ILatticeLevel, defaultConfidentialityLattice, IntegrityLattice, defaultIntegrityLattice } from "./ifbc/lattice";

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for communication with the backend.
 */
export interface IIFBCFormula extends ICBCFormula {
  preVariables: VariableIFbCState;
  postVariables: VariableIFbCState;
  isConfidential: boolean;
}

export interface ILocalIFBCFormula extends LocalCBCFormula {
  preVariables: VariableIFbCState;
  postVariables: VariableIFbCState;
  integrityLattice: IntegrityLattice;
  confidentialityLattice: ConfidentialityLattice;
  isConfidential: boolean;
}

/**
 * The representation of the data in the graphical editor in a json object.
 * Used for saving state.
 */
export class IFBCFormula implements IIFBCFormula {
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
    public preVariables: VariableIFbCState = { confidentiality: {}, integrity: {} },
    public postVariables: VariableIFbCState = { confidentiality: {}, integrity: {} },
    public level: ILatticeLevel,
    public javaVariables: IJavaVariable[] = [],
    public globalConditions: ICondition[] = [],
    public renamings: IRenaming[] | null = null,
    public isConfidential: boolean = false,
    public isProven: boolean = false,
    public position: IPosition = new Position(0, 0),
  ) {}

  static fromCBCFormula(formula: CBCFormula, lattice: ConfidentialityLattice) {
    return new IFBCFormula(
      formula.name,
      formula.statement,
      formula.preCondition,
      formula.postCondition,
      { confidentiality: {}, integrity: {} },
      { confidentiality: {}, integrity: {} },
      lattice.minimalLevel,
      formula.javaVariables,
      formula.globalConditions,
      formula.renamings,
      false,
      formula.isProven,
      formula.position,
    )
  }
}

export class LocalIFBCFormula implements ILocalIFBCFormula {
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
    public preVariables: VariableIFbCState = { confidentiality: {}, integrity: {}},
    public postVariables: VariableIFbCState = { confidentiality: {}, integrity: {}},
    public confidentialityLattice: ConfidentialityLattice = defaultConfidentialityLattice,
    public integrityLattice: IntegrityLattice = defaultIntegrityLattice,
    public globalConditions: ICondition[] = [],
    public renamings: IRenaming[] | null = null,
    public isProven: boolean = false,
    public isConfidential: boolean = false,
    public position: IPosition = new Position(0, 0),
  ) {}
}

export interface IFBCVerificationResult extends IIFBCFormula {
  context: {
    confidentiality?: {
      successfull: boolean;
      data: {
        [id: string]: {
          postVariableState: {
            levels: {
              [variable: string]: ILatticeLevel;
            }
          }
          contextLevel: ILatticeLevel;
          compatibleWithFinalPostState: boolean;
        }
      }
    }
    integrity?: {
      successfull: boolean;
      data: {
        [id: string]: {
          postVariableState: {
            levels: {
              [variable: string]: ILatticeLevel;
            }
          }
          contextLevel: ILatticeLevel;
          compatibleWithFinalPostState: boolean;
        }
      }
    }
  }
}