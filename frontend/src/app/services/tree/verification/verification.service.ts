import { Injectable } from "@angular/core";
import { LocalCBCFormula } from "../../../types/CBCFormula";
import { ProjectService } from "../../project/project.service";
import { TreeService } from "../tree.service";
import { IRootStatement } from "../../../types/statements/root-statement";
import { ConsoleService } from "../../console/console.service";

/**
 * Service to distribute the verification result from the http response to the tree service.
 * @see TreeService
 */
@Injectable({
  providedIn: "root",
})
export class VerificationService {
  constructor(
    private projectService: ProjectService,
    private treeService: TreeService,
    private consoleService: ConsoleService,
  ) {}

  public verifyInfo(msg: string) {
    switch (msg) {
      case "verification started":
        this.consoleService.addStringInfo("Verification started.");
        this.consoleService.beginLoading("verifying");
        break;
      case "verification initialized":
        this.consoleService.addStringInfo("Verification initialized.");
        break;
      case "verification complete":
        break;
      default:
        break;
    }
  }

  public async next(formula: LocalCBCFormula, urn: string) {
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
      });
      if (
        (currentFormula as LocalCBCFormula).statement &&
        formula.statement.type == "ROOT" &&
        (formula.statement as IRootStatement).statement?.isProven
      ) {
        (currentFormula as LocalCBCFormula).statement!.isProven = true;
      }
      this.projectService.syncFileContent(urn, currentFormula);
    }
    if (formula.isProven) {
      this.consoleService.addStringInfo(
        `Verification successful: The formula "${formula.name}" is verified.`,
        "pi pi-check-circle",
      );
    } else {
      this.consoleService.addStringInfo(
        `Verification failed: The formula "${formula.name}" could not be (completely) verified.`,
        "pi pi-times-circle",
      );
    }
  }
}
