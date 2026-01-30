import { Injectable } from "@angular/core";
import { ProjectPredicate } from "../../types/ProjectPredicate";
import { ProjectService } from "../project/project.service";

@Injectable({
  providedIn: "root",
})
export class PredicateService {
  private predicates: ProjectPredicate[] = [];
  constructor(private projectService: ProjectService) {
    this.predicates = projectService.getPredicates();
  }
  private idCounter = 0;
  public getPredicates() {
    return this.predicates;
  }
  public addPredicate() {
    const newPredicate: ProjectPredicate = {
      id: String(this.idCounter),
      name: "untitled predicate " + this.idCounter,
      definition: "",
      signature: "",
    };
    this.idCounter++;
    this.predicates.push(newPredicate);
    this.projectService.savePredicates(this.predicates);
    return newPredicate;
  }

  public removePredicate(predicate: ProjectPredicate) {
    this.predicates = this.predicates.filter((p) => p.id != predicate.id);
    this.projectService.savePredicates(this.predicates);
  }

  public save() {
    this.projectService.savePredicates(this.predicates);
  }

  public exportPredicates(): string {
    let result = "\\predicates {\n";
    for (const predicate of this.predicates) {
      result += `${predicate.name}(${this.signatureWithOnlyTypes(predicate.signature)});\n`;
    }
    result += "}\n";
    result += "\\rules {\n";
    for (const predicate of this.predicates) {
      result += `${predicate.name} {\n`;
      const signatureTokens = this.parseSignatureTokens(predicate.signature);
      const notFreeVariables = this.parseBoundVariables(predicate.definition);
      for (let i = 0; i < signatureTokens.length; i++) {
        result += `\\schemaVar \\term ${signatureTokens[i]};\n`;
      }
      notFreeVariables.forEach((variable) => {
        result += `\\schemaVar \\variable ${variable};\n`;
      });
      result += `\\find(${predicate.name}(${this.signatureWithOnlyNames(predicate.signature)}))\n`;
      const signatureNames = this.extractNamesFromSignatureTokens(
        signatureTokens,
      ).filter((n) => n.length > 0);
      const boundVarNames = this.extractNamesFromSignatureTokens(
        notFreeVariables,
      ).filter((n) => n.length > 0);
      const conditions: string[] = [];
      boundVarNames.forEach((boundVar) => {
        signatureNames.forEach((sigVar) => {
          conditions.push(`\\notFreeIn(${boundVar}, ${sigVar})`);
        });
      });
      if (conditions.length > 0) {
        result += `\\varcond (${conditions.join(", ")})\n`;
      }
      //Replace .length with length() and
      result += `\\replacewith (${predicate.definition
        .replace(/(?:^|\s|;|\()(\w+)\.length(?=\s|;|\+|-|\)|$)/g, "length($1)")
        .replace(/==>/g, "->")
        .replace(/&&/g, "&")
        .replace(/\|\|/g, "|")
        .replace(/==/g, "=")})\n`;
      result += "\\heuristics(simplify)\n};\n";
    }
    result += "}\n";
    if (!this.projectService.findByUrn("include")) {
      this.projectService.addDirectory("", "include");
    }
    if (!this.projectService.findByUrn("include/generatedPredicates.key")) {
      this.projectService.addFile("include", "generatedPredicates", "key");
    }
    this.projectService.syncFileContent(
      "include/generatedPredicates.key",
      result,
    );
    return result;
  }

  private parseBoundVariables(definition: string) {
    const allTokens = definition.split(RegExp(/\\forall|\\exists/gm));
    const tokens: string[] = [];
    // eg "\forall @private @whatnot int k; if (k < 4 && [...]" will return "@private @whatnot int k"
    allTokens.forEach((expression, index) => {
      if (expression.length > 0 && index > 0) {
        const split = expression.split(";", 1);
        tokens.push(split[0]);
      }
    });
    return tokens;
  }

  private parseSignatureTokens(signature: string) {
    const firstSplit = signature.indexOf("(");
    const lastSplit = signature.indexOf(")");
    const splitSignature = signature.substring(firstSplit + 1, lastSplit);
    return splitSignature.split(RegExp(/, |,/gm)).map((token) => token.trim());
  }

  private extractNamesFromSignatureTokens(signatureTokens: string[]) {
    return signatureTokens.map((expression) => {
      return expression.split(" ").pop()?.trim() ?? expression.trim();
    });
  }

  private extractTypesFromSignatureTokens(signatureTokens: string[]) {
    return signatureTokens.map((expression) => {
      return expression.split(" ").shift()?.trim() ?? expression.trim();
    });
  }

  private signatureWithOnlyNames(signature: string) {
    return this.extractNamesFromSignatureTokens(
      this.parseSignatureTokens(signature),
    ).reduce((prev = "", current) => prev + ", " + current);
  }

  private signatureWithOnlyTypes(signature: string) {
    return this.extractTypesFromSignatureTokens(
      this.parseSignatureTokens(signature),
    ).reduce((prev = "", current) => prev + ", " + current);
  }
}
