import { Injectable, inject } from "@angular/core";
import { LocalCBCFormula } from "../../../types/CBCFormula";
import { ProjectService } from "../../project/project.service";
import { TreeService } from "../tree.service";
import { ConsoleService } from "../../console/console.service";
import { IAbstractStatement } from "../../../types/statements/abstract-statement";
import { AbstractStatementNode } from "../../../types/statements/nodes/abstract-statement-node";
import { GlobalSettingsService } from "../../global-settings.service";
import { ConsoleInfoLine, ConsoleLogGroup } from "../../console/log";
import {
  CompleteMessage,
  DoneMessage,
  LogMessage,
  VerificationMessage,
} from "../../../types/VerificationMessage";
import { FUNCTIONAL_VERIFIER_ID } from "../../../types/Verifier";

/**
 * Formats a `done` message's `durationMs` for its console line: milliseconds under a second,
 * one decimal of seconds under a minute, otherwise whole minutes and seconds.
 */
export function formatVerifierDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)} s`;
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} m ${seconds} s`;
}

/** One run's `done` tally for a console group: how many Verifiers passed or failed. */
interface VerifierTally {
  passed: number;
  failed: number;
  /** `func`'s own `done` was `proven: false`: no other Verifier ran. */
  funcFailed: boolean;
  /** The job's total run time, from `complete`. `undefined` until `complete` arrives. */
  totalDurationMs?: number;
}

/**
 * Service to distribute the verification result from the http response to the tree service.
 * @see TreeService
 */
@Injectable({
  providedIn: "root",
})
export class VerificationService {
  private projectService = inject(ProjectService);
  private treeService = inject(TreeService);
  private consoleService = inject(ConsoleService);
  private globalSettingsService = inject(GlobalSettingsService);

  /** One run's `done` tally per console group, so `next`/`nextStatement` can push the overview once the run ends. */
  private readonly tallies = new WeakMap<ConsoleLogGroup, VerifierTally>();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  public beginVerificationLog() {
    const group = this.consoleService.addGroup();
    group.status = "RUNNING";
    this.tallies.set(group, { passed: 0, failed: 0, funcFailed: false });
    this.consoleService.beginLoading("verifying");
    return group;
  }

  /**
   * Handle one message off the job's WS: a log line (attributed to whichever Verifier or
   * functional verification produced it), a per-Verifier done signal, or the final complete
   * signal — which carries no console line of its own (fetching the result is the caller's job)
   * but remembers the run's total duration for the overview.
   */
  public verifyInfo(group: ConsoleLogGroup, msg: VerificationMessage) {
    switch (msg.type) {
      case "log":
        this.logMessage(group, msg);
        break;
      case "done":
        this.doneMessage(group, msg);
        break;
      case "complete":
        this.completeMessage(group, msg);
        break;
    }
  }

  private logMessage(group: ConsoleLogGroup, msg: LogMessage) {
    // A line about the job's own orchestration, not any Verifier's output: no [name] prefix.
    if (msg.verifier === undefined) {
      group.lines.push(new ConsoleInfoLine(msg.message));
      return;
    }
    group.lines.push(
      new ConsoleInfoLine(`[${msg.verifier}] ${msg.message}`),
    );
  }

  private doneMessage(group: ConsoleLogGroup, msg: DoneMessage) {
    const time = formatVerifierDuration(msg.durationMs);
    group.lines.push(
      new ConsoleInfoLine(
        `${msg.verifier} finished: ${msg.proven ? "passed" : "failed"} (${time}).`,
        msg.proven ? "pi pi-check-circle" : "pi pi-times-circle",
      ),
    );
    const tally = this.tallies.get(group);
    if (!tally) {
      return;
    }
    if (msg.proven) {
      tally.passed++;
      return;
    }
    tally.failed++;
    if (msg.verifier === FUNCTIONAL_VERIFIER_ID) {
      tally.funcFailed = true;
    }
  }

  /** Remembers the run's total duration, so `pushTotalTime` can push it once the closing line lands. */
  private completeMessage(group: ConsoleLogGroup, msg: CompleteMessage) {
    const tally = this.tallies.get(group);
    if (tally) {
      tally.totalDurationMs = msg.durationMs;
    }
  }

  /**
   * y: how many entries the Root's Verifier map holds — every Catalog Verifier, `func` included,
   * whether it ran or not. After the reset (`NarrowedProgram.resetForRun`) the Root holds one
   * entry per Catalog Verifier, so this is the Catalog's size. `formula.statement` is always the
   * frontend's `ROOT` wrapper, which the mapper carries the Root's `verifiers` onto on import.
   */
  private totalVerifiers(formula: LocalCBCFormula): number {
    const verifiers = formula.statement?.verifiers ?? {};
    return Object.keys(verifiers).length;
  }

  /**
   * Pushes the test-runner style overview below the closing line: `x/y verifiers successful`,
   * then `z ... failed` and `n ... did not run` where non-zero, then the functional-failure line
   * where `func` itself failed. z counts `done(proven: false)` only; n = y − x − z covers disabled
   * and unavailable Verifiers as well as those skipped because functional verification failed.
   * Pushes nothing when the tally is absent — the closing line's verdict is decided separately, by
   * `formula.isProven`, and does not depend on this.
   */
  private pushOverview(group: ConsoleLogGroup, formula: LocalCBCFormula) {
    const tally = this.tallies.get(group);
    if (!tally) {
      return;
    }
    const y = this.totalVerifiers(formula);
    const x = tally.passed;
    const z = tally.failed;
    const n = y - x - z;
    group.lines.push(new ConsoleInfoLine(`${x}/${y} verifiers successful`));
    if (z > 0) {
      group.lines.push(new ConsoleInfoLine(`${z} ${z === 1 ? "verifier" : "verifiers"} failed`));
    }
    if (n > 0) {
      group.lines.push(new ConsoleInfoLine(`${n} ${n === 1 ? "verifier" : "verifiers"} did not run`));
    }
    if (tally.funcFailed) {
      group.lines.push(
        new ConsoleInfoLine("No other Verifiers ran because functional verification failed."),
      );
    }
  }

  /**
   * Pushes `Total time: <time>` as the overview's last line, backend-measured on `complete`.
   * Pushes nothing when no duration was recorded
   * for this group (only possible for a caller that never went through `beginVerificationLog`,
   * or one that calls `next`/`nextStatement` without ever having relayed a `complete` message).
   */
  private pushTotalTime(group: ConsoleLogGroup) {
    const tally = this.tallies.get(group);
    if (!tally || tally.totalDurationMs === undefined) {
      return;
    }
    group.lines.push(new ConsoleInfoLine(`Total time: ${formatVerifierDuration(tally.totalDurationMs)}`));
  }

  public async next(
    group: ConsoleLogGroup,
    formula: LocalCBCFormula,
    urn: string,
  ) {
    this.consoleService.finishLoading();
    if (formula.statement) {
      const currentFormula = await this.projectService.getFileContent(urn);
      const currentStatements = this.treeService.getStatementsFromFormula(
        currentFormula as LocalCBCFormula,
      );
      const newStatements = this.treeService.getStatementsFromFormula(formula);
      // The statements should be in the same order, since the structure should be unchanged.
      currentStatements.forEach((stmt, index) => {
        stmt.isProven = newStatements[index]?.isProven;
        stmt.nodeState = this.treeService.deriveNodeState(newStatements[index]?.verifiers);
        stmt.verifiers = newStatements[index]?.verifiers ?? stmt.verifiers;
      });
      this.treeService.reapplyRunChanges(currentStatements);
      this.projectService.syncLocalFileContent(urn, currentFormula);
    }
    this.globalSettingsService.isVerifying = false;
    if (formula.isProven) {
      group.lines.push(
        new ConsoleInfoLine(
          `Verification successful: The formula "${formula.name}" is verified.`,
          "pi pi-check-circle",
        ),
      );
      group.status = "SUCCESS";
    } else {
      group.lines.push(
        new ConsoleInfoLine(
          `Verification failed: The formula "${formula.name}" could not be (completely) verified.`,
          "pi pi-times-circle",
        ),
      );
      group.status = "FAIL";
    }
    this.pushOverview(group, formula);
    this.pushTotalTime(group);
  }

  /**
   * Handle verification result for a single statement and its subtree
   * @param formula The formula returned from backend verification
   * @param statementNode The statement node that was verified
   * @param urn urn of the file being verified
   */
  public async nextStatement(
    group: ConsoleLogGroup,
    formula: LocalCBCFormula,
    statementNode: AbstractStatementNode,
    urn: string,
  ) {
    this.consoleService.finishLoading();

    if (!formula.statement) {
      group.lines.push(
        new ConsoleInfoLine(
          `Verification failed: No statement in response for "${statementNode.statement.name}".`,
          "pi pi-times-circle",
        ),
      );
      group.status = "FAIL";
      return;
    }

    // Get statements from the verification result
    const resultStatements = this.treeService.getStatementsFromFormula(formula);

    // Collect all nodes in the subtree starting from the verified node
    const subtreeNodes = this.treeService.collectSubtreeNodes(statementNode);

    // Collect statements from subtree in order
    const subtreeStatements: IAbstractStatement[] = [];
    this.collectStatementsFromNode(statementNode, subtreeStatements);

    // If the original node wasn't ROOT, the result will have a ROOT wrapper
    // So we need to skip the ROOT statement in the result
    let resultStartIndex = 0;
    if (
      statementNode.statement.type !== "ROOT" &&
      resultStatements.length > 0 &&
      resultStatements[0].type === "ROOT"
    ) {
      resultStartIndex = 1; // Skip the ROOT wrapper
    }

    // Match statements from result to nodes in the subtree by order
    const minLength = Math.min(
      resultStatements.length - resultStartIndex,
      subtreeStatements.length,
    );

    const updatedStatements: IAbstractStatement[] = [];
    for (let i = 0; i < minLength; i++) {
      const resultStmt = resultStatements[resultStartIndex + i];
      const subtreeStmt = subtreeStatements[i];

      // Find the node corresponding to this statement
      const node = subtreeNodes.find((n) => n.statement.id === subtreeStmt.id);
      if (node) {
        node.statement.isProven = resultStmt.isProven || false;
        node.statement.nodeState = this.treeService.deriveNodeState(resultStmt.verifiers);
        node.statement.verifiers = resultStmt.verifiers ?? node.statement.verifiers;
        updatedStatements.push(node.statement);
      }
    }

    this.treeService.reapplyRunChanges(updatedStatements);

    // Refresh nodes to trigger UI update
    this.treeService.refreshNodes();

    // Show success/failure message
    if (formula.isProven) {
      group.lines.push(
        new ConsoleInfoLine(
          `Verification successful: The statement "${statementNode.statement.name}" and its subtree are verified.`,
          "pi pi-check-circle",
        ),
      );
      group.status = "SUCCESS";
    } else {
      group.lines.push(
        new ConsoleInfoLine(
          `Verification failed: The statement "${statementNode.statement.name}" or its subtree could not be (completely) verified.`,
          "pi pi-times-circle",
        ),
      );
      group.status = "FAIL";
    }
    this.pushOverview(group, formula);
    this.pushTotalTime(group);
  }
  /**
   * Collect statements from a node and its subtree in order
   * @param node The root node
   * @param statements Array to collect statements into
   */
  private collectStatementsFromNode(
    node: AbstractStatementNode,
    statements: IAbstractStatement[],
  ): void {
    statements.push(node.statement);
    for (const child of node.children) {
      if (child) {
        this.collectStatementsFromNode(child, statements);
      }
    }
  }

  abort(urn: string) {
    this.globalSettingsService.isVerifying = false;
  }
}
