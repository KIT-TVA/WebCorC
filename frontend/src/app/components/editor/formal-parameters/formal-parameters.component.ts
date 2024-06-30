import {Component, Input, Type} from '@angular/core';
import { CommonModule } from '@angular/common';
import {TreeService} from "../../../services/tree/tree.service";
import {FormalNumberSet} from "../../../types/form-spec-values/formalNumberSet";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {FormalParameter} from "../../../types/formal-parameter";
import {MatListModule} from "@angular/material/list";

@Component({
  selector: 'formal-parameters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatListModule],
  templateUrl: './formal-parameters.component.html',
  styleUrl: './formal-parameters.component.scss'
})
export class FormalParametersComponent {
  @Input() treeService!: TreeService;

  addFormalParameterGroup = this._formBuilder.group({
    name: new FormControl("", [Validators.required, Validators.maxLength(1)]),
    values: new FormControl("")
  });

  constructor(private _formBuilder: FormBuilder) {
  }

  addFormalParameter(): void {
    const name = this.addFormalParameterGroup.controls.name.value;
    if (!name) {
      return;
    }

    const values = this.addFormalParameterGroup.controls.values.value;
    if (!values) {
      // symbolic operator
    } else if (this.matchExactly(values, FormalNumberSet.REPRESENTATION)) {
      this.treeService.addFormalParameter(new FormalParameter(name, new FormalNumberSet(values)));
    }
    this.addFormalParameterGroup.reset();
  }

  matchExactly(input: string, regex: RegExp): boolean {
    const matches = input.match(regex);
    if (!matches) {
      return false;
    }

    let totalLength = 0;
    for (let match of matches) {
      totalLength += match.length;
    }

    return totalLength === input.length;
  }
}
