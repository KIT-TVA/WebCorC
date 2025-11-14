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
      id: String(this.idCounter++),
      name: "untitled predicate",
      definition: "",
      signature: "",
    };
    this.predicates.push(newPredicate);
    return newPredicate;
  }

  public removePredicate(predicate: ProjectPredicate) {
    this.predicates = this.predicates.filter((p) => p.id != predicate.id);
  }

  public exportPredicates(): string {
    let result = "\predicates {\n";
    for (const predicate of this.predicates) {
      result += `${predicate.name}(${predicate.signature});\n`;
    }
    for (const predicate of this.predicates) {
      result += `${predicate.name} {\n${predicate.definition}\n}\n`;
    }
    result += "}\n";
    if (!this.projectService.findByPath("predicates.key")) {
      this.projectService.addFile("/", "predicates", "key");
    }
    this.projectService.syncFileContent("predicates.key", result);
    return result;
  }
}
