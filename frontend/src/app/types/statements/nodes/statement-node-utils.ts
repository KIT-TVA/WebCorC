import { CompositionStatementNode } from "./composition-statement-node";
import {
  CompositionStatement,
  ICompositionStatement,
} from "../composition-statement";
import { RepetitionStatementNode } from "./repetition-statement-node";
import {
  IRepetitionStatement,
  RepetitionStatement,
} from "../repetition-statement";
import { SelectionStatementNode } from "./selection-statement-node";
import {
  ISelectionStatement,
  SelectionStatement,
} from "../selection-statement";
import { SkipStatementNode } from "./skip-statement-node";
import { SimpleStatementNode } from "./simple-statement-node";
import { IStatement, Statement } from "../simple-statement";
import {
  AbstractStatement,
  IAbstractStatement,
  StatementType,
} from "../abstract-statement";
import { AbstractStatementNode } from "./abstract-statement-node";
import { Condition } from "../../condition/condition";
import { SkipStatement } from "../strong-weak-statement";
import { RootStatementNode } from "./root-statement-node";
import { RootStatement } from "../root-statement";
import { IPosition } from "../../position";
import { signal } from "@angular/core";

class idGenerator {
  private static idCounter = 0;
  public static get newId() {
    return String(idGenerator.idCounter++);
  }
}

export function statementNodeUtils(
  statement: IAbstractStatement,
  parent?: AbstractStatementNode,
) {
  switch (statement.type) {
    case "ROOT":
      return new RootStatementNode(statement as RootStatement, parent);
    case "COMPOSITION":
      return new CompositionStatementNode(
        statement as ICompositionStatement,
        parent,
      );
    case "REPETITION":
      return new RepetitionStatementNode(
        statement as IRepetitionStatement,
        parent,
      );
    case "SELECTION":
      return new SelectionStatementNode(
        statement as ISelectionStatement,
        parent,
      );
    case "SKIP":
      return new SkipStatementNode(statement as ISelectionStatement, parent);
    case "STATEMENT":
      return new SimpleStatementNode(statement as IStatement, parent);
    default:
      return new AbstractStatementNode(statement, parent);
  }
}

export function createEmptyStatementNode(
  type: StatementType,
  parent?: AbstractStatementNode,
) {
  let position: IPosition = {
    xinPx: 0,
    yinPx: 0,
  };
  if (parent?.position()) {
    position = {
      xinPx: parent?.position().xinPx + 300,
      yinPx: parent?.position().yinPx + 300,
    };
  }
  switch (type) {
    case "ROOT":
      return new RootStatementNode(
        new RootStatement(
          idGenerator.newId,
          new Condition(""),
          new Condition(""),
          undefined,
          position,
        ),
        parent,
      );
    case "STATEMENT":
      return new SimpleStatementNode(
        new Statement(
          idGenerator.newId,
          new Condition(""),
          new Condition(""),
          "",
          position,
        ),
        parent,
      );
    case "SKIP":
      return new SkipStatementNode(
        new SkipStatement(
          idGenerator.newId,
          new Condition(""),
          new Condition(""),
          position,
        ),
        parent,
      );
    case "SELECTION":
      return new SelectionStatementNode(
        new SelectionStatement(
          idGenerator.newId,
          new Condition(""),
          new Condition(""),
          [],
          [],
          false,
          position,
        ),
        parent,
      );
    case "COMPOSITION":
      return new CompositionStatementNode(
        new CompositionStatement(
          idGenerator.newId,
          new Condition(""),
          new Condition(""),
          new Condition(""),
          undefined,
          undefined,
          position,
        ),
        parent,
      );
    case "REPETITION":
      return new RepetitionStatementNode(
        new RepetitionStatement(
          idGenerator.newId,
          new Condition(""),
          new Condition(""),
          undefined,
          new Condition(""),
          new Condition(""),
          new Condition(""),
          false,
          false,
          false,
          position,
        ),
        parent,
      );
    case "RETURN":
      return new AbstractStatementNode(
        new AbstractStatement(
          idGenerator.newId,
          "RETURN",
          new Condition(""),
          new Condition(""),
          position,
        ),
        parent,
      );
  }
}

export function disconnectNodes(
  parent: AbstractStatementNode,
  child: AbstractStatementNode,
) {
  child.overridePostcondition(
    signal(new Condition(child.postcondition().condition)),
  );
  child.overridePrecondition(
    signal(new Condition(child.precondition().condition)),
  );
  parent.deleteChild(child);
  child.parent = undefined;
}
