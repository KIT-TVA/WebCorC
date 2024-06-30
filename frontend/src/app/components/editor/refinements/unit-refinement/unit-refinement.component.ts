import {Component, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Refinement} from "../../../../types/refinement";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInput, MatInputModule} from "@angular/material/input";
import {RefinementComponent} from "../refinement/refinement.component";
import {QuantumUnitary} from "../../../../types/quantum-unitary";
import {TreeService} from "../../../../services/tree/tree.service";
import {QbCRegister} from "../../../../translation/variables";
import {MatButtonModule} from "@angular/material/button";
import {MatMenuModule} from "@angular/material/menu";

@Component({
  selector: 'app-unit-refinement',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, RefinementComponent, ReactiveFormsModule, MatButtonModule, MatMenuModule],
  templateUrl: './unit-refinement.component.html',
  styleUrl: './unit-refinement.component.scss'
})
export class UnitRefinementComponent extends Refinement {
  @ViewChild("input", {read: MatInput}) input!: MatInput;

  private _declaredRegister: QbCRegister;
  private _unitOperation: QuantumUnitary;
  declaredRegisterGroup: FormGroup;

  constructor(treeService: TreeService, formBuilder: FormBuilder) {
    super(treeService);
    this._declaredRegister = new QbCRegister();
    this._unitOperation = new QuantumUnitary();

    this.declaredRegisterGroup = formBuilder.group({
      declaredVariables: ""
    });
    this.declaredRegisterGroup.valueChanges.subscribe(changes =>
      this._declaredRegister.updateNames(changes.declaredVariables, treeService));
  }

  override getTitle(): string {
    return "unit";
  }

  override removeVariableUsages() {
    this.treeService.removeVariables(this._declaredRegister.names);
  }

  get declaredRegister(): QbCRegister {
    return this._declaredRegister;
  }

  get unitOperation(): QuantumUnitary {
    return this._unitOperation;
  }

  override getBoxRowHeight(): string {
    return "120px";
  }

  override export(): any {
    const outline = super.export();
    outline["declaredRegister"] = this.declaredRegister.export();
    outline["unitOperation"] = this.unitOperation.export();
    return outline;
  }

  unitOperationEditingFinished(): void {

  }

  setDeclaredRegisterAndFormGroupValue(value: string): void {
    this.declaredRegisterGroup.setValue({declaredVariables: value});
  }

  insertSymbol(symbol: string): void {
    const inp: HTMLInputElement = document.getElementById(this.input.id) as HTMLInputElement;
    this.unitOperation.content =
      this.unitOperation.content.substring(0, inp.selectionStart!) + symbol + this.unitOperation.content.substring(inp.selectionEnd!);
  }
}
