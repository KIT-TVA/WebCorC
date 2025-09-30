import { Injectable } from "@angular/core";
import { ProjectPredicate } from "../../types/ProjectPredicate";

@Injectable({
  providedIn: "root",
})
export class PredicateService {
  private readonly predicates: ProjectPredicate[] = [];
  public getPredicates() {
    return this.predicates;
  }
  public addPredicate() {
    const newPredicate: ProjectPredicate = {
      id: "",
      name: "untitled predicate",
      definition: "",
      signature: "",
    };
    this.predicates.push(newPredicate);
    return newPredicate;
  }
}
