import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeService } from '../../../services/tree/tree.service';
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { FormArray, FormBuilder, FormControl, FormGroup,
         FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import { MatDividerModule} from "@angular/material/divider";
import { MatFormFieldModule} from "@angular/material/form-field";
import { MatListModule} from "@angular/material/list";
import { Condition, ConditionDTO } from '../../../types/condition/condition';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiChatService } from '../../../services/ai-chat/ai-chat.service';

/**
 * Component for the user to manage the global conditions in a cbc formula.
 * Uses {@link TreeService} for saving the global conditions.
 * Uses Angular Reactive Forms to dynamically show the inputs.
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
    selector: 'app-global-conditions',
    imports: [CommonModule, FormsModule, MatButtonModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatListModule, ReactiveFormsModule, MatIconModule, MatTooltipModule],
    templateUrl: './global-conditions.component.html',
    styleUrl: './global-conditions.component.scss'
})
export class GlobalConditionsComponent {

  /**
   * Form template 
   */
  private _conditions : FormGroup = this._fb.group({
    newCondition: new FormControl("", []),
    items: this._fb.array([])
  })

  public constructor(
    private _fb: FormBuilder,
    public treeService: TreeService,
    private aiChatService: AiChatService
  ) {}

  /**
   * Saves the content of the input with the id newCondition to the @see TreeService
   * And adds a new item to the form with the content of the new created condition 
   */
  public addCondition() : void {
    const value : string = this.conditions.controls['newCondition'].value.trim()

    if (!value) {
      return
    }

    if (!this.treeService.addGlobalCondition(value)) {
      this.conditions.controls['newCondition'].reset()
      return
    }

    // create a new formcontrol based on the value 
    // [Validators.required] is used to ensure visual feedback for a empty input to the user
    const condition = this._fb.group({
      name: new FormControl(value, [Validators.required])
    })

    this.items.push(condition)
    this.conditions.controls['newCondition'].reset()
  }

  /**
   * Eventlistener for the delete key
   * @param event The event of pressing the delete key
   * @param index The index of the condition to remove
   */
  public onDelete(event : Event, index : number) {
    event.preventDefault()
    this.removeCondition(index)
  }

  /**
   * Eventlistene for the enter key
   * @param event The event of pressing the enter key
   */
  public onEnter(event : Event) {
    event.preventDefault()
    this.addCondition()
  }

  /**
   * Removes the condition at the index of the items array and syncs the changes to the @see TreeService
   * @param index The index of the condition to remove
   */
  public removeCondition(index : number) : void {
    this.treeService.removeGlobalCondition(this.items.at(index).value.name)
    this.items.removeAt(index)
  }

  /**
   * Send the condition content to the ai chat service
   * @param index The index to identify the conditon to send the condition to the ai chat service
   */
  public askAi(index : number) : void {
    this.aiChatService.addCondition(new Condition(0, "", this.items.at(index).value.name))
  }

  /**
   * Remove all conditions from the form and @see TreeService
   */
  public removeAllConditions() {
    for (let i = 0; i < this.items.length; i++) {
      this.treeService.removeGlobalCondition(this.items.at(i).value.name)
    }

    this.items.clear()
    this.conditions.controls['newCondition'].reset()
  }


  /**
   * Import Condtions from the file state found in @see ProjectService
   * @param conditions The condtions to import
   */  
  public importConditions(conditions: ConditionDTO[]) {
    for (const condition of conditions) {
      const conditionControl = this._fb.group({
        name : new FormControl(condition.content, [Validators.required])
      })

      this.items.push(conditionControl)
      this.treeService.addGlobalCondition(condition.content)
    }
  }

  /**
   * Get the array of inputs for rendering the inputs
   */
  public get items() : FormArray {
    return this.conditions.controls["items"] as FormArray
  }

  /**
   * Getter for the form group
   */
  public get conditions() : FormGroup {
    return this._conditions
  }

  /**
   * Getter to show error state for the new condition input asking the user to add the condition to the conditions
   */
  public get dirtyState() : boolean {
    return !(this._conditions.controls['newCondition'].value == null || this._conditions.controls['newCondition'].value == '') 
  }
}
