import { Injectable } from "@angular/core";
import {
  AbstractStatement,
  IAbstractStatement,
  IVerifiers,
  sparseVerifierEntry,
} from "../../../types/statements/abstract-statement";
import { IPosition, Position } from "../../../types/position";
import {
  ISkipStatement,
  SkipStatement,
} from "../../../types/statements/strong-weak-statement";
import {
  CompositionStatement,
  ICompositionStatement,
} from "../../../types/statements/composition-statement";
import {
  IRepetitionStatement,
  RepetitionStatement,
} from "../../../types/statements/repetition-statement";
import {
  ISelectionStatement,
  SelectionStatement,
} from "../../../types/statements/selection-statement";
import {
  IStatement,
  Statement,
} from "../../../types/statements/simple-statement";
import {
  CBCFormula,
  ICBCFormula,
  LocalCBCFormula,
} from "../../../types/CBCFormula";
import { IRenaming, Renaming } from "../../../types/Renaming";
import { Condition, ICondition } from "../../../types/condition/condition";
import {
  IRootStatement,
  RootStatement,
} from "../../../types/statements/root-statement";

/**
 * Service for importing the cbcformula from the interface {@see ICBCFormula } to the only implementation {@see CBCFormula }.
 * This service is necessary because only a object in form of the interface ICBCFormula is returned of the network call of the api.
 * To properly use the class the mapping in the importFormula function is needed.
 */
@Injectable({
  providedIn: "root",
})
export class CbcFormulaMapperService {
  constructor() {}

  /**
   * Map a object in form of the interface ICBCFormula to the only implementation CBCFormula
   * @param formula The formula to import.
   * @returns The class with the same content of the passed interface.
   */
  public importFormula(formula: ICBCFormula): LocalCBCFormula {
    let position: IPosition;
    if ("position" in formula) {
      position = formula.position as IPosition;
    } else {
      position = new Position(
        formula.statement?.position?.xinPx ?? 0,
        (formula.statement?.position?.yinPx ?? 0) - 100,
      );
    }
    const statement = this.importStatement(formula.statement);
    // If the imported statement is already a RootStatement, don't wrap it again.
    let rootStatement: RootStatement | undefined;
    if (statement && statement.type === RootStatement.TYPE) {
      rootStatement = statement as RootStatement;
      rootStatement.isProven = formula.isProven;
      // Ensure pre/post/position are filled from formula if missing on the root
      rootStatement.preCondition =
        rootStatement.preCondition || formula.preCondition;
      rootStatement.postCondition =
        rootStatement.postCondition || formula.postCondition;
      if (rootStatement.position === undefined && position) {
        rootStatement.position = position;
      }
      if (Object.keys(rootStatement.verifiers).length === 0) {
        rootStatement.verifiers = this.importVerifiers(
          formula.verifiers,
        );
      }
    } else {
      rootStatement = new RootStatement(
        "rootNode",
        formula.preCondition ?? statement?.preCondition,
        formula.postCondition ?? statement?.postCondition,
        statement,
        position,
      );
      rootStatement.isProven = formula.isProven;
      rootStatement.verifiers = this.importVerifiers(
        formula.verifiers,
      );
    }

    return new LocalCBCFormula(
      formula.name,
      rootStatement,
      formula.javaVariables,
      this.importGlobalConditions(formula.globalConditions),
      this.importRenaming(formula.renamings),
      formula.isProven,
      /*TODO maybe implement a some position logic here or get it from the backend*/
      undefined,
    );
  }

  public exportFormula(formula: LocalCBCFormula): CBCFormula {
    const newFormula = new CBCFormula(
      formula.name,
      formula.statement?.statement,
      formula.statement?.preCondition,
      formula.statement?.postCondition,
      formula.javaVariables,
      formula.globalConditions,
      formula.renamings,
      formula.isProven,
      formula.statement?.position,
      formula.statement?.verifiers ?? {},
    );
    return newFormula;
  }

  private importStatement(
    statement: IAbstractStatement | undefined,
  ): AbstractStatement | undefined {
    if (!statement) {
      return;
    }

    switch (statement.type) {
      case Statement.TYPE:
        return this.importSimpleStatement(statement as IStatement);
      case SelectionStatement.TYPE:
        return this.importSelectionStatement(statement as ISelectionStatement);
      case RepetitionStatement.TYPE:
        return this.importRepetitionStatement(
          statement as IRepetitionStatement,
        );
      case CompositionStatement.TYPE:
        return this.importCompositionStatement(
          statement as ICompositionStatement,
        );
      case SkipStatement.TYPE:
        return this.importSkipStatement(statement as ISkipStatement);
      case RootStatement.TYPE:
        return this.importRootStatement(statement as IRootStatement);
    }
    return;
  }

  private importSimpleStatement(statement: IStatement): Statement {
    const newStatement = new Statement(
      statement.name,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      statement.programStatement,
      statement.position,
    );
    newStatement.isProven = statement.isProven;
    newStatement.verifiers = this.importVerifiers(
      statement.verifiers,
    );
    return newStatement;
  }

  private importRootStatement(statement: IRootStatement): RootStatement {
    const newStatement = new RootStatement(
      statement.name,
      statement.preCondition,
      statement.postCondition,
      this.importStatement(statement.statement),
      statement.position,
    );
    newStatement.isProven = statement.isProven;
    newStatement.verifiers = this.importVerifiers(
      statement.verifiers,
    );
    return newStatement;
  }

  private importSelectionStatement(
    statement: ISelectionStatement,
  ): SelectionStatement {
    const children: (AbstractStatement | undefined)[] = [];
    for (const child of (statement as ISelectionStatement).commands) {
      children.push(this.importStatement(child));
    }

    const guards: ICondition[] = [];
    for (const guard of (statement as ISelectionStatement).guards) {
      guards.push(this.importCondition(guard));
    }

    const newSelectionStatement = new SelectionStatement(
      statement.name,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      guards,
      children,
      statement.isPreProven,
      statement.position,
    );
    newSelectionStatement.isProven = statement.isProven;
    newSelectionStatement.verifiers = this.importVerifiers(
      statement.verifiers,
    );
    return newSelectionStatement;
  }

  private importRepetitionStatement(
    statement: IRepetitionStatement,
  ): RepetitionStatement {
    const newRepetitionStatement = new RepetitionStatement(
      statement.name,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      this.importStatement(statement.loopStatement),
      this.importCondition(statement.variant),
      this.importCondition(statement.invariant),
      this.importCondition(statement.guard),
      statement.isVariantProven,
      statement.isPreProven,
      statement.isPostProven,
      statement.position,
    );
    newRepetitionStatement.isProven = statement.isProven;
    newRepetitionStatement.verifiers = this.importVerifiers(
      statement.verifiers,
    );
    return newRepetitionStatement;
  }

  private importCompositionStatement(
    statement: ICompositionStatement,
  ): CompositionStatement {
    const newCompositionStatement = new CompositionStatement(
      statement.name,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      this.importCondition(statement.intermediateCondition),
      this.importStatement(statement.firstStatement),
      this.importStatement(statement.secondStatement),
      statement.position,
    );
    newCompositionStatement.isProven = statement.isProven;
    newCompositionStatement.verifiers = this.importVerifiers(
      statement.verifiers,
    );
    return newCompositionStatement;
  }

  private importSkipStatement(statement: ISkipStatement): SkipStatement {
    const newSkipStatement = new SkipStatement(
      statement.name,
      this.importCondition(statement.preCondition),
      this.importCondition(statement.postCondition),
      statement.position,
    );
    newSkipStatement.isProven = statement.isProven;
    newSkipStatement.verifiers = this.importVerifiers(
      statement.verifiers,
    );
    return newSkipStatement;
  }

  private importGlobalConditions(
    conditions: ICondition[] | null,
  ): ICondition[] {
    const newConditions: Condition[] = [];

    if (!conditions) {
      return newConditions;
    }

    for (const condition of conditions) {
      newConditions.push(this.importCondition(condition));
    }

    return newConditions;
  }

  private importCondition(condition: ICondition | undefined): Condition {
    if (!condition) {
      return new Condition("");
    }
    return new Condition(condition.condition);
  }

  private importVerifiers(
    verifiers: IVerifiers | undefined,
  ): IVerifiers {
    const imported: IVerifiers = {};
    for (const [verifierId, entry] of Object.entries(verifiers ?? {})) {
      // Absent or empty conditions stay absent (a result-only entry has none), and a
      // result is opaque — carried through as-is wherever a verifier reported one.
      const sparse = sparseVerifierEntry({
        preCondition: entry.preCondition && this.importCondition(entry.preCondition),
        postCondition: entry.postCondition && this.importCondition(entry.postCondition),
        intermediateCondition:
          entry.intermediateCondition && this.importCondition(entry.intermediateCondition),
        proven: entry.proven,
        status: entry.status,
        disabled: entry.disabled,
        settingsUpdatedAt: entry.settingsUpdatedAt,
      });
      if (sparse) {
        imported[verifierId] = sparse;
      }
    }
    return imported;
  }

  private importPosition(position: IPosition): Position {
    return new Position(position.xinPx, position.yinPx);
  }

  private importRenaming(renaming: IRenaming[] | null) {
    const newRenames: Renaming[] = [];

    if (!renaming) {
      return newRenames;
    }

    for (const rename of renaming) {
      newRenames.push(
        new Renaming(rename.type, rename.function, rename.newName),
      );
    }

    return newRenames;
  }
}
