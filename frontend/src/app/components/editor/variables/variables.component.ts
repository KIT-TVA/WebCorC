import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeService} from "../../../services/tree/tree.service";
import { MatInputModule} from "@angular/material/input";
import { MatButtonModule} from "@angular/material/button";
import { MatIconModule} from "@angular/material/icon";
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import { MatDividerModule} from "@angular/material/divider";
import { MatFormFieldModule} from "@angular/material/form-field";
import { MatListModule} from "@angular/material/list";

/**
 * Component to edit the variables of the file.
 * Uses {@link TreeService} to manage and persist the variables
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
    selector: 'app-variables',
    imports: [CommonModule, FormsModule, MatButtonModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatListModule, ReactiveFormsModule, MatIconModule],
    templateUrl: './variables.component.html',
    styleUrl: './variables.component.scss'
})
export class VariablesComponent {

  /**
   * Forms Template
   */
  private _variables: FormGroup = this._fb.group({
    newVariable: new FormControl("", []),
    items: this._fb.array([])
  }) 

  public constructor(private _fb: FormBuilder,  public treeService: TreeService) {}

  /**
   * Add new variable and check for duplicate variable names
   */
  public addVariable() : void {
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

  /**
   * Eventlistener triggered on pressing enter key in the form
   * @param event 
   */
  public onEnter(event : Event) {
    event.preventDefault()
    this.addVariable()
  }

  /**
   * Eventlistener triggered on pressing deleting key in the form
   * @param event 
   * @param i 
   */
  public onDelete(event : Event, i : number) {
    event.preventDefault()
    this.removeVariable(i)
  }

  /**
   * Remove variables based on the index 
   * @param index The index of the variable to remove
   */
  public removeVariable(index : number) : void {
    this.treeService.removeVariables([this.items.at(index).value.name])
    this.items.removeAt(index)
  }

  /**
   * Clear the form
   */
  public removeAllVariables() : void {

    for (let i = 0; i < this.items.length; i++) {
      this.treeService.removeVariables([this.items.at(i).value.name])
    }

    this.items.clear()
    this.variables.controls['newVariable'].reset()
  }

  /**
   * Import variables on opening the file 
   * @param variables the variables to import
   */
  public importVariables(variables : string[]) {
    for (const variable of variables) {
      const variableControl = this._fb.group({
        name: new FormControl(variable, [Validators.required])
      })

      this.items.push(variableControl)
      this.treeService.addVariable(variable)
    }
  }

  public get items() : FormArray {
    return this.variables.controls["items"] as FormArray
  }

  public get variables() : FormGroup {
    return this._variables
  }
}
