import { Component } from "@angular/core";
import { Fluid } from "primeng/fluid";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import { InputGroup } from "primeng/inputgroup";
import { FloatLabel } from "primeng/floatlabel";
import { InputText } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { PredicateService } from "../../../services/predicates/predicate.service";
import { FormsModule } from "@angular/forms";
import { ProjectPredicate } from "../../../types/ProjectPredicate";

@Component({
  selector: "app-predicate-manager",
  imports: [
    Fluid,
    Select,
    Button,
    InputGroup,
    FloatLabel,
    InputText,
    Textarea,
    FormsModule,
  ],
  templateUrl: "./predicate-manager.component.html",
  styleUrl: "./predicate-manager.component.css",
})
export class PredicateManagerComponent {
  protected predicates;

  constructor(private predicateService: PredicateService) {
    this.predicates = predicateService.getPredicates();
  }

  protected selectedPredicate: ProjectPredicate | undefined = undefined;

  protected addPredicate() {
    this.selectedPredicate = this.predicateService.addPredicate();
  }
}
