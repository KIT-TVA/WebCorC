import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TreeService } from '../../../services/tree/tree.service';

@Component({
  selector: 'app-renaming',
  imports: [CommonModule, FormsModule, MatButtonModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatListModule, ReactiveFormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './renaming.component.html',
  styleUrl: './renaming.component.scss'
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

  public removeRenaming(index : number) : void {


    const group : FormGroup = this.items.at(index) as FormGroup

    const type : string | null =  group.get('type')?.value
    const original : string | null = group.get('original')?.value
    const newName : string | null = group.get('newName')?.value

    console.log(type)
    console.log(original)
    console.log(newName)

    if (!type || !original || !newName) {
      return
    }

    this.treeService.removeRenaming(type, original, newName)

    this.items.removeAt(index)
  }

  public onDelete(event : Event, i : number) {
    event.preventDefault()
  }

  public onEnter(event : Event) {
    event.preventDefault()
    this.addRenaming()
  }


  public get renames() : FormGroup {
    return this._renames
  }

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
