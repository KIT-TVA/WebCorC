import { Component, OnInit } from "@angular/core";
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
import { Message } from "primeng/message";

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
    Message,
  ],
  templateUrl: "./predicate-manager.component.html",
  styleUrl: "./predicate-manager.component.css",
})
export class PredicateManagerComponent implements OnInit {
  protected predicates: ProjectPredicate[] = [];

  constructor(private predicateService: PredicateService) {}

  ngOnInit() {
    this.predicateService.retrievePredicates();
    this.predicates = this.predicateService.getPredicates();
  }

  protected selectedPredicate: ProjectPredicate | undefined;

  protected selectPredicate() {
    this.predicateName = this.selectedPredicate!.name;
    this.predicateDefinition = this.selectedPredicate!.definition;
    this.predicateSignature = this.selectedPredicate!.signature;
  }

  protected savePredicate() {
    if (!this.selectedPredicate) return;
    this.selectedPredicate.name = this.predicateName;
    this.selectedPredicate.definition = this.predicateDefinition;
    this.selectedPredicate.signature = this.predicateSignature;
    this.predicateService.save();
  }

  protected predicateName: string = "";
  protected predicateSignature: string = "";
  protected predicateDefinition: string = "";

  protected addPredicate() {
    //There appears to be a bug in PrimeNG, which means we have to do delete something in the array before the selection component will change its label.
    //Hours spent: too many, just leave it like this
    this.selectedPredicate = this.predicateService.addPredicate();
    if (this.selectedPredicate.id === "0") {
      this.deletePredicate();
      this.selectedPredicate = this.predicateService.addPredicate();
    }
  }
  protected deletePredicate() {
    if (!this.selectedPredicate) return;
    this.predicateService.removePredicate(this.selectedPredicate);

    this.predicateName = "";
    this.predicateSignature = "";
    this.predicateDefinition = "";
    this.predicates = this.predicateService.getPredicates();
    this.selectedPredicate = undefined;
  }
}
