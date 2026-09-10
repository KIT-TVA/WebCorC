import { Injectable, inject } from "@angular/core";
import { LocalCBCFormula } from "../../../types/CBCFormula";
import { ProjectService } from "../../project/project.service";
import { TreeService } from "../tree.service";
import { IRootStatement } from "../../../types/statements/root-statement";
import { ConsoleService } from "../../console/console.service";
import { IAbstractStatement } from "../../../types/statements/abstract-statement";
import { AbstractStatementNode } from "../../../types/statements/nodes/abstract-statement-node";
import { GlobalSettingsService } from "../../global-settings.service";
import { ConsoleInfoLine, ConsoleLogGroup } from "../../console/log";

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

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  public beginVerificationLog() {
    const group = this.consoleService.addGroup();
    group.status = "RUNNING";
    return group;
  }

  public verifyInfo(group: ConsoleLogGroup, msg: string) {
    switch (msg) {
      case "verification started":
        group.lines.push(new ConsoleInfoLine("Verification started."));
        this.consoleService.beginLoading("verifying");
        break;
      case "verification initialized":
        group.lines.push(new ConsoleInfoLine("Verification initialized."));
        break;
      case "verification complete":
      default:
        group.lines.push(new ConsoleInfoLine(msg));
        break;
    }
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
        stmt.nodeState = newStatements[index]?.isProven ? "verified" : "failed";
      });
      if (
        (currentFormula as LocalCBCFormula).statement &&
        formula.statement.type == "ROOT" &&
        (formula.statement as IRootStatement).statement?.isProven
      ) {
        (currentFormula as LocalCBCFormula).statement!.isProven = true;
        (currentFormula as LocalCBCFormula).statement!.nodeState = "verified";
      }
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

      const tempFormula = this.treeService.createTempFormulaFromNode(statementNode);
      const currentStatements =
          this.treeService.getStatementsFromFormula(tempFormula);
      const newStatements = this.treeService.getStatementsFromFormula(formula);

      currentStatements.forEach((stmt, i) => {
          const proven = newStatements[i]?.isProven ?? false;
          stmt.isProven = proven;
          stmt.nodeState = proven ? "verified" : "failed";
      });

      if (
          formula.statement.type === "ROOT" &&
          (formula.statement as IRootStatement).statement?.isProven
      ) {
          currentStatements[0].isProven = true;
          currentStatements[0].nodeState = "verified";
          console.log("verify root")
      }

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
  }

  abort(urn: string) {
    this.globalSettingsService.isVerifying = false;
  }
}
