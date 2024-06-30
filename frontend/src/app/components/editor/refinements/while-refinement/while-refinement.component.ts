import {Component, ElementRef, OnChanges, SimpleChanges, ViewChild, ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import {QbCRegister} from "../../../../translation/variables";
import {TreeService} from "../../../../services/tree/tree.service";
import {Refinement} from "../../../../types/refinement";
import {QbCMeasurement} from "../../../../translation/measurements";
import {RefinementComponent} from "../refinement/refinement.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {GridTileBorderDirective} from "../../../../directives/grid-tile-border.directive";
import {LinkComponent} from "../link/link.component";
import {RefinementWidgetComponent} from "../../../../widgets/refinement-widget/refinement-widget.component";
import {ChooseRefinementComponent} from "../../../choose-refinement/choose-refinement.component";
import {MatDialog} from "@angular/material/dialog";
import {Condition} from "../../../../types/condition/condition";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {Postcondition} from "../../../../types/condition/postcondition";

@Component({
  selector: 'app-while-refinement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule, GridTileBorderDirective, LinkComponent, RefinementWidgetComponent, ConditionEditorComponent],
  templateUrl: './while-refinement.component.html',
  styleUrl: './while-refinement.component.scss'
})
export class WhileRefinementComponent extends Refinement {
  private _measuredRegister: QbCRegister;
  private readonly _measurement: QbCMeasurement = new QbCMeasurement("B");
  private _loopInvariant: Condition;
  private _bodyRefinement: Refinement | undefined;
  private _bodyPostCondition: Condition;

  private _bodyRefinementRef: ElementRef | undefined;

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  measuredRegisterGroup: FormGroup;

  constructor(treeService: TreeService,
              private dialog: MatDialog, formBuilder: FormBuilder) {
    super(treeService);
    this._measuredRegister = new QbCRegister();
    this._loopInvariant = new Condition(this.id, "Loop Invariant");
    this._bodyPostCondition = new Condition(this.id, "Loop Postcond.");

    this.updateBodyPostcondition();
    this.postcondition.contentChangeEmitter.subscribe(() => this.updateBodyPostcondition());
    this.loopInvariant.contentChangeEmitter.subscribe(() => this.updateBodyPostcondition());

    treeService.deletionNotifier.subscribe(refinement => {
      if (this.bodyRefinement === refinement) {
        this._bodyRefinement = undefined;
        this._bodyRefinementRef!.nativeElement.remove();
        this._bodyRefinementRef = undefined;
      }
    });

    this.measuredRegisterGroup = formBuilder.group({
      measuredVariables: ""
    });
    this.measuredRegisterGroup.valueChanges.subscribe(changes =>
      this._measuredRegister.updateNames(changes.measuredVariables, treeService));
  }

  updateBodyPostcondition(): void {
    this._bodyPostCondition.content = `${this.measurement.name}0(${this.postcondition.content})+${this.measurement.name}1(${this.loopInvariant.content})`;
  }

  getTitle(): string {
    return "while";
  }

  override removeVariableUsages() {
    this.treeService.removeVariables(this._measuredRegister.names);
    this._bodyRefinement?.removeVariableUsages();
  }

  override export(): any {
    const outline = super.export();
    outline["measuredRegister"] = this._measuredRegister.export();
    outline["measurement"] = this._measurement.export();
    outline["loopInvariant"] = this.loopInvariant.export();

    let outlineBody = null;
    if (this._bodyRefinement) {
      outlineBody = this._bodyRefinement.export();
    }
    outline["bodyRefinement"] = outlineBody;
    return outline;
  }

  chooseRefinement(): void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const componentRef = this.componentSpawn.createComponent(result);
        const createdSubComponent = componentRef.instance as Refinement;

        this._bodyRefinementRef = componentRef.location;
        this.bodyRefinement = createdSubComponent;
      }
    });
  }

  measuredVariableEditingFinished(): void {

  }

  get measuredRegister(): QbCRegister {
    return this._measuredRegister;
  }

  get measurement(): QbCMeasurement {
    return this._measurement;
  }

  get bodyRefinement(): Refinement | undefined {
    return this._bodyRefinement;
  }

  get loopInvariant(): Condition {
    return this._loopInvariant;
  }

  set bodyRefinement(value: Refinement | undefined) {
    this._bodyRefinement = value;

    if (this._bodyRefinement) {
      this._bodyRefinement.precondition = this._loopInvariant;
      this._bodyRefinement.postcondition = this._bodyPostCondition;
    }
  }

  set bodyRefinementRef(value: ElementRef | undefined) {
    this._bodyRefinementRef = value;
  }

  get bodyRefinementRef(): ElementRef | undefined {
    return this._bodyRefinementRef;
  }

  setMeasuredRegisterAndFormGroupValue(value: string): void {
    this.measuredRegisterGroup.setValue({measuredVariables: value});
  }
}
