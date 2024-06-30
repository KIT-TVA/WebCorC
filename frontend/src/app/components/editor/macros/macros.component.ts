import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatListModule} from "@angular/material/list";
import {TreeService} from "../../../services/tree/tree.service";
import {Macro} from "../../../types/macro";

@Component({
  selector: 'app-macros',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatListModule, ReactiveFormsModule],
  templateUrl: './macros.component.html',
  styleUrl: './macros.component.scss'
})
export class MacrosComponent {
  addMacroGroup = this._fb.group({
    name: new FormControl("", [Validators.required]),
    expression: new FormControl("", [Validators.required])
  })

  constructor(private _fb: FormBuilder, public treeService: TreeService) {
  }

  addMacro(): void {
    const name = this.addMacroGroup.controls.name.value;
    if (!name) {
      return;
    }

    const expression = this.addMacroGroup.controls.expression.value;
    if (!expression) {
      return;
    }

    this.treeService.addMacro(new Macro(name, expression));
    this.addMacroGroup.reset();
  }
}
