import {Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TreeService} from "../../../services/tree/tree.service";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatDividerModule} from "@angular/material/divider";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatListModule} from "@angular/material/list";

@Component({
  selector: 'app-variables',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatListModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './variables.component.html',
  styleUrl: './variables.component.scss'
})
export class VariablesComponent implements OnInit {

  variables: FormGroup = this._fb.group({
    newVariable: new FormControl("", []),
    items: this._fb.array([])
  }) 

  constructor(private _fb: FormBuilder,  public treeService: TreeService) {}

  ngOnInit(): void {
   
  }

  addVariable() : void {
    const value : string = this.variables.controls['newVariable'].value

    if (!value) {
      return
    }

    if (!this.treeService.addVariable(value)) {
      this.variables.controls['newVariable'].reset()
      return
    }

    const variable = this._fb.group({
      name: new FormControl(value, [Validators.required])
    })

    this.items.push(variable)
    this.variables.controls['newVariable'].reset()
  }

  removeVariable(index : number) : void {
    this.treeService.removeVariables([this.items.at(index).value.name])
    this.items.removeAt(index)
  }

  removeAllVariables() : void {

    for (let i = 0; i < this.items.length; i++) {
      this.treeService.removeVariables([this.items.at(i).value.name])
    }

    this.items.clear()
  }

  importVariables(variables : string[]) {
    for (const variable of variables) {
      const variableControl = this._fb.group({
        name: new FormControl(variable, [Validators.required])
      })

      this.items.push(variableControl)
      this.treeService.addVariable(variable)
    }
  }


  get items() : FormArray {
    return this.variables.controls["items"] as FormArray
  }
}
