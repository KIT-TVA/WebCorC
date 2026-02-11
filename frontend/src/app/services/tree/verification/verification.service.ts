import { Injectable } from "@angular/core";
import { LocalCBCFormula } from "../../../types/CBCFormula";
import { ProjectService } from "../../project/project.service";
import { TreeService } from "../tree.service";
import { IRootStatement } from "../../../types/statements/root-statement";
import { ConsoleService } from "../../console/console.service";
import { IAbstractStatement } from "../../../types/statements/abstract-statement";
import { AbstractStatementNode } from "../../../types/statements/nodes/abstract-statement-node";
import { GlobalSettingsService } from "../../global-settings.service";

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
    private globalSettingsService: GlobalSettingsService,
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
      this.projectService.syncLocalFileContent(urn, currentFormula);
    }
    this.globalSettingsService.isVerifying = false;
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

  /**
   * Handle verification result for a single statement and its subtree
   * @param formula The formula returned from backend verification
   * @param statementNode The statement node that was verified
   * @param urn urn of the file being verified
   */
  public async nextStatement(
    formula: LocalCBCFormula,
    statementNode: AbstractStatementNode,
    urn: string,
  ) {
    this.consoleService.finishLoading();

    if (!formula.statement) {
      this.consoleService.addStringInfo(
        `Verification failed: No statement in response for "${statementNode.statement.name}".`,
        "pi pi-times-circle",
      );
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

    for (let i = 0; i < minLength; i++) {
      const resultStmt = resultStatements[resultStartIndex + i];
      const subtreeStmt = subtreeStatements[i];

      // Find the node corresponding to this statement
      const node = subtreeNodes.find((n) => n.statement.id === subtreeStmt.id);
      if (node) {
        node.statement.isProven = resultStmt.isProven || false;
      }
    }

    // Update the root statement node if it's a ROOT type
    if (
      formula.statement.type === "ROOT" &&
      (formula.statement as IRootStatement).statement?.isProven
    ) {
      statementNode.statement.isProven = true;
    }

    // Refresh nodes to trigger UI update
    this.treeService.refreshNodes();

    // Show success/failure message
    if (formula.isProven) {
      this.consoleService.addStringInfo(
        `Verification successful: The statement "${statementNode.statement.name}" and its subtree are verified.`,
        "pi pi-check-circle",
      );
    } else {
      this.consoleService.addStringInfo(
        `Verification failed: The statement "${statementNode.statement.name}" or its subtree could not be (completely) verified.`,
        "pi pi-times-circle",
      );
    }
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
