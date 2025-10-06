import { Injectable } from "@angular/core";
import { ProjectPredicate } from "../../types/ProjectPredicate";

@Injectable({
  providedIn: "root",
})
export class PredicateService {
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
}
