import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeService } from '../../../services/tree/tree.service';
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatDividerModule} from "@angular/material/divider";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatListModule} from "@angular/material/list";

@Component({
  selector: 'app-global-conditions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatListModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './global-conditions.component.html',
  styleUrl: './global-conditions.component.scss'
})
export class GlobalConditionsComponent implements OnInit  {

  conditions : FormGroup = this._fb.group({
    newCondition: new FormControl("", []),
    items: this._fb.array([])
  })

  constructor(private _fb: FormBuilder, public treeService: TreeService) {}


  ngOnInit(): void {
    
  }


  addCondition() : void {
    
    const value : string = this.conditions.controls['newCondition'].value

    if (!value) {
      return
    }

    const condition = this._fb.group({
      name: new FormControl(value, [Validators.required])
    })

    this.items.push(condition)
    this.conditions.controls['newCondition'].reset()
  }

  removeCondition(index : number) : void {
    this.items.removeAt(index)
  }

  get items() : FormArray {
    return this.conditions.controls["items"] as FormArray
  }
}
