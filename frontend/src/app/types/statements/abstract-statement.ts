import { IPosition, Position } from "../position";
import { ICondition } from "../condition/condition";
import { IStatement } from "./simple-statement";
import { ICompositionStatement } from "./composition-statement";
import { IRepetitionStatement } from "./repetition-statement";
import { ISkipStatement } from "./strong-weak-statement";
import { ISelectionStatement } from "./selection-statement";
import { FUNCTIONAL_VERIFIER_ID } from "../Verifier";

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
 * One verifier's condition and result for a statement. Mirrors the statement's own
 * condition properties: every statement has a pre- and a postcondition, and a
 * composition additionally has an intermediate condition — which is only present
 * for compositions, and only when non-empty. `preCondition`/`postCondition` are
 * themselves optional: a Verifier that was never given a condition for this
 * statement still reports a result, producing a result-only entry with neither.
 * `proven`/`status` are that verifier's result for this statement, absent until it
 * has actually reported one. `settingsUpdatedAt` is an opaque stamp, only ever compared for
 * equality.
 */
export interface IVerifierEntry {
  preCondition?: ICondition;
  postCondition?: ICondition;
  intermediateCondition?: ICondition;
  proven?: boolean;
  status?: string;
  disabled?: true;
  settingsUpdatedAt?: number;
}

/**
 * The sparse form of a verifier entry: empty-string conditions are dropped (the
 * backend cannot parse `""` and rejects the whole request), and an entry left with
 * neither a condition nor a reported result is dropped altogether.
 */
export function sparseVerifierEntry(
  entry: IVerifierEntry,
): IVerifierEntry | undefined {
  const sparse: IVerifierEntry = {};
  if (entry.preCondition?.condition) {
    sparse.preCondition = entry.preCondition;
  }
  if (entry.postCondition?.condition) {
    sparse.postCondition = entry.postCondition;
  }
  if (entry.intermediateCondition?.condition) {
    sparse.intermediateCondition = entry.intermediateCondition;
  }
  if (entry.proven !== undefined) {
    sparse.proven = entry.proven;
  }
  if (entry.status !== undefined) {
    sparse.status = entry.status;
  }
  if (entry.disabled !== undefined) {
    sparse.disabled = entry.disabled;
  }
  if (entry.settingsUpdatedAt !== undefined) {
    sparse.settingsUpdatedAt = entry.settingsUpdatedAt;
  }
  return Object.keys(sparse).length === 0 ? undefined : sparse;
}

/**
 * Per-verifier conditions and results of a statement, keyed by verifier id. Sparse:
 * only verifiers with at least one non-empty condition or a reported result have an
 * entry. The primary (functional) verifier's own conditions are still the statement's
 * own `preCondition`/`postCondition`/`intermediateCondition`, but it does appear here
 * too, keyed by `FUNCTIONAL_VERIFIER_ID`, as a result-only entry (`proven` only, never
 * `status` or conditions).
 */
export type IVerifiers = Record<string, IVerifierEntry>;

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
  verifiers?: IVerifiers;
  isProven: boolean;
  nodeState: NodeState;
  position?: IPosition;
}

export type NodeState =
  | 'verified-all'
  | 'verified-functional'
  | 'settings-changed'
  | 'unverified'
  | 'failed'
  | 'failed-non-functional';


/**
 * A Verifier missing from `verifiers` counts as `disabled` when it's in `enabledVerifiers`;
 * a `disabled` Verifier absent from `enabledVerifiers` has no effect on the result.
 */
export function nodeStateFor(
  verifiers: IVerifiers | undefined,
  enabledVerifiers: readonly string[],
): NodeState {
  const functionalVerifier = verifiers?.[FUNCTIONAL_VERIFIER_ID];
  if (!functionalVerifier) {
    return 'unverified';
  }
  if (functionalVerifier.proven === false) {
    return 'failed';
  }
  if (enabledVerifiers.length === 0) {
    return 'verified-functional';
  }
  if (
      enabledVerifiers.some(verifierId => {
        const verifier = verifiers?.[verifierId];
        return verifier?.proven === false && !verifier?.disabled;
      })
  ) {
    return 'failed-non-functional';
  }
  if (
      enabledVerifiers.some(verifierId => {
        const verifier = verifiers?.[verifierId];
        return verifier?.disabled || !verifier;
      })
  ) {
    return 'settings-changed';
  }
  return 'verified-all';
}

export type VerifierResult = 'proven' | 'failed' | 'stale' | 'none';

/**
 * `isStale`: the result ran under other settings than the Verifier's current ones. A
 * `disabled` entry means the Verifier did not run in the last check, so it has no result.
 */
export function verifierResultFor(
  entry: IVerifierEntry | undefined,
  isStale: boolean,
): VerifierResult {
  if (entry?.proven === undefined || entry.disabled) {
    return 'none';
  }
  if (isStale) {
    return 'stale';
  }
  return entry.proven ? 'proven' : 'failed';
}

/**
 * The shared highlight classes live in the global `styles.css`. A Verifier switched off now
 * keeps its result's color, dimmed.
 */
export function verifierResultClass(result: VerifierResult, switchedOff = false): string {
  return switchedOff
    ? `verifier-result--${result} verifier-result--off`
    : `verifier-result--${result}`;
}

/**
 * Data only representation of the statements edited in the editor.
 * @see IAbstractStatement
 */
export class AbstractStatement implements IAbstractStatement {
  /**
   * Own properties holding nested child statements, serialized last (see
   * {@link toJSON}) so the scalar fields and (verifier) conditions stay readable
   * at the top of each statement object.
   */
  private static readonly CHILD_STATEMENT_KEYS = [
    "statement",
    "firstStatement",
    "secondStatement",
    "loopStatement",
    "commands",
  ];

  public readonly id: string;
  public isProven = false;
  public nodeState: NodeState;
  public verifiers: IVerifiers = {};

  public toJSON(): Record<string, unknown> {
    const properties = { ...this } as Record<string, unknown>;
    const ordered: Record<string, unknown> = {};
    for (const key of Object.keys(properties)) {
      if (!AbstractStatement.CHILD_STATEMENT_KEYS.includes(key)) {
        ordered[key] = properties[key];
      }
    }
    for (const key of AbstractStatement.CHILD_STATEMENT_KEYS) {
      if (key in properties) {
        ordered[key] = properties[key];
      }
    }
    return ordered;
  }
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
    this.nodeState = 'unverified'
  }
}
