
import {Component} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TreeService} from '../../../services/tree/tree.service';
import {IRenaming} from "../../../types/Renaming";

/**
 * Component to allow renaming, each renaming includes the original name, new name and the type of the operation to rename.
 * These attributes map one to one to a input which are group together and added or removed together.
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
    selector: 'app-renaming',
    imports: [FormsModule, MatButtonModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatListModule, ReactiveFormsModule, MatIconModule, MatTooltipModule],
    templateUrl: './renaming.component.html',
    standalone: true,
    styleUrl: './renaming.component.css'
})
export class RenamingComponent {

  private _renames : FormGroup = this._fb.group({
    newRenaming : this._fb.group({
      type : new FormControl("", [Validators.required]),
      original : new FormControl("", [Validators.required]),
      newName : new FormControl("", [Validators.required])
    }),
    items : this._fb.array([])
  })

  public constructor (private _fb : FormBuilder, public treeService : TreeService) {}

  /**
   * Add renaming by reading the value of the contents of the inputs in the new renaming group.
   * Resets the content of the inputs of the new renaming group.
   */
  public addRenaming() : void {
    const type : string = this._newType.value
    const original : string = this._newOriginal.value
    const newName : string = this._newName.value

    if (!type || !original || !newName) { 
      return
    }

    this.treeService.addRenaming(type, original, newName)

    const renaming = this._fb.group({
      type : new FormControl(type, [Validators.required]),
      original : new FormControl(original, [Validators.required]),
      newName : new FormControl(newName, [Validators.required])
    })

    this.items.push(renaming)

    this._newType.reset()
    this._newOriginal.reset()
    this._newName.reset()
  }

  /**
   * Delete renaming by the index
   * @param index The index of the renaming in the items array to remove
   */
  public removeRenaming(index : number) : void {
    const group : FormGroup = this.items.at(index) as FormGroup

    const type : string | null =  group.get('type')?.value
    const original : string | null = group.get('original')?.value
    const newName : string | null = group.get('newName')?.value

    if (!type || !original || !newName) {
      return
    }

    this.treeService.removeRenaming(type, original, newName)

    this.items.removeAt(index)
  }

  /**
   * Function to remove the renaming on pressing delete in the input.
   * @param event The event which triggers this function. Default action is prevented.
   * @param i The index of the renaming in the items in the renaming form
   */
  public onDelete(event : Event, i : number) : void {
    event.preventDefault()
    this.removeRenaming(i)
  }

  /**
   * Function to add the new renaming group of inputs to the renaming input
   * @param event The event to trigger this function. Default action is prevented.
   */
  public onEnter(event : Event) : void {
    event.preventDefault()
    this.addRenaming()
  }

  /**
   * Reset the this component by deleting all renaming
   */
  public removeAllRenaming() {
    for (let i = 0; i < this.items.length; i++) {
      const group = this.items.at(i) as FormGroup

      const type : string | null =  group.get('type')?.value
      const original : string | null = group.get('original')?.value
      const newName : string | null = group.get('newName')?.value
  
      if (!type || !original || !newName) {
        continue
      }
  
      this.treeService.removeRenaming(type, original, newName)
    }

    this.items.clear()
    this._newType.reset()
    this._newOriginal.reset()
    this._newName.reset()
  }

  /**
   * Import renamings into this component
   * @param renames Array of renamings to import
   */
  public importRenaming(renames : IRenaming[] | null) {
    if (!renames) {
      return
    }

    for (const rename of renames) {
      const renaming = this._fb.group({
        type : new FormControl(rename.type, [Validators.required]),
        original : new FormControl(rename.function, [Validators.required]),
        newName : new FormControl(rename.newName, [Validators.required])
      })
      
      this.items.push(renaming)
      this.treeService.addRenaming(rename.type, rename.function, rename.newName)
    }

  }
 
  /**
   * Getter for the form
   */
  public get renames() : FormGroup {
    return this._renames
  }

  /**
   * Getter for the items of the form, which represent a renaming
   */
  public get items() : FormArray {
    return this._renames.controls['items'] as FormArray
  }

  private get _newRenaming() : FormGroup {
    return this._renames.controls['newRenaming'] as FormGroup
  }

  private get _newType() : FormControl {
    return this._newRenaming.controls['type'] as FormControl
  }

  private get _newOriginal() : FormControl {
    return this._newRenaming.controls['original'] as FormControl
  }

  private get _newName() : FormControl {
    return this._newRenaming.controls['newName'] as FormControl
  }
}
