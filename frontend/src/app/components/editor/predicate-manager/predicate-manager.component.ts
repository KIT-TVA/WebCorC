import { Component } from '@angular/core';
import { Fluid } from "primeng/fluid";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import { InputGroup } from "primeng/inputgroup";
import { FloatLabel } from "primeng/floatlabel";
import { InputText } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";

@Component({
  selector: "app-predicate-manager",
  imports: [Fluid, Select, Button, InputGroup, FloatLabel, InputText, Textarea],
  templateUrl: "./predicate-manager.component.html",
  styleUrl: "./predicate-manager.component.css",
})
export class PredicateManagerComponent {}
