import {Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RefinementComponent} from "../refinement/refinement.component";
import {Refinement} from "../../../../types/refinement";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {TreeService} from "../../../../services/tree/tree.service";
import {QbCRegister} from "../../../../translation/variables";

@Component({
  selector: 'app-init-refinement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './init-refinement.component.html',
  styleUrl: './init-refinement.component.scss'
})
export class InitRefinementComponent extends Refinement {
  private _initializedRegister: QbCRegister;
  initVariablesFormGroup: FormGroup;

  constructor(treeService: TreeService, formBuilder: FormBuilder) {
    super(treeService);
    this._initializedRegister = new QbCRegister();
    this.initVariablesFormGroup = formBuilder.group({
      initializedVariables: ""
    });
    this.initVariablesFormGroup.valueChanges.subscribe(changes =>
      this._initializedRegister.updateNames(changes.initializedVariables, treeService));
  }

  override getTitle(): string {
    return "init";
  }

  override removeVariableUsages() {
    this.treeService.removeVariables(this._initializedRegister.names);
  }

  override getBoxRowHeight(): string {
    return "120px";
  }

  override export(): any {
    const outline = super.export();
    outline["initializedRegister"] = this.initializedRegister.export();
    return outline;
  }

  initializationEditingFinished(): void {

  }

  get initializedRegister(): QbCRegister {
    return this._initializedRegister;
  }

  setInitializedRegisterAndFormGroupValue(value: string): void {
    this.initVariablesFormGroup.setValue({initializedVariables: value});
  }
}
