import { Injectable } from "@angular/core";
import { ProjectPredicate } from "../../types/ProjectPredicate";
import { ProjectService } from "../project/project.service";

@Injectable({
  providedIn: "root",
})
export class PredicateService {
  constructor(private projectService: ProjectService) {}
  private idCounter = 0;
  private predicates: ProjectPredicate[] = [];
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
    return newPredicate;
  }

  public removePredicate(predicate: ProjectPredicate) {
    this.predicates = this.predicates.filter((p) => p.id != predicate.id);
  }

  public exportPredicates(): string {
    let result = "\\predicates {\n";
    for (const predicate of this.predicates) {
      result += `${predicate.signature};\n`;
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
      result += `\\replacewith (${predicate.definition})\n`;
      result += "\\heuristics(simplify)\n};\n";
    }
    result += "}\n";
    if (!this.projectService.findByUrn("/predicates.key")) {
      this.projectService.addFile("/", "predicates", "key");
    }
    this.projectService.syncFileContent("/predicates.key", result);
    return result;
  }

  private parseBoundVariables(definition: string) {
    const allTokens = definition.split(RegExp(/\\forall|\\exists/gm));
    const tokens: string[] = [];
    // eg "\forall @private @whatnot int k; if (k < 4 && [...]" will return "@private @whatnot int k"
    allTokens.forEach((expression) => {
      if (expression.length > 0) {
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

  private signatureWithOnlyNames(signature: string) {
    return this.extractNamesFromSignatureTokens(
      this.parseSignatureTokens(signature),
    ).reduce((prev = "", current) => prev + ", " + current);
  }
}
