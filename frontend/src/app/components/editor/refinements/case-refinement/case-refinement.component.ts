import {Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Refinement} from "../../../../types/refinement";
import {QbCRegister} from "../../../../translation/variables";
import {QbCMeasurement} from "../../../../translation/measurements";
import {Condition} from "../../../../types/condition/condition";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TreeService} from "../../../../services/tree/tree.service";
import {MatDialog} from "@angular/material/dialog";
import {ChooseRefinementComponent} from "../../../choose-refinement/choose-refinement.component";
import {RefinementComponent} from "../refinement/refinement.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {LinkComponent} from "../link/link.component";
import {RefinementWidgetComponent} from "../../../../widgets/refinement-widget/refinement-widget.component";
import {GridTileBorderDirective} from "../../../../directives/grid-tile-border.directive";

@Component({
  selector: 'app-case-refinement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, ConditionEditorComponent, LinkComponent, RefinementWidgetComponent, GridTileBorderDirective],
  templateUrl: './case-refinement.component.html',
  styleUrl: './case-refinement.component.scss'
})
export class CaseRefinementComponent extends Refinement {
  private _measuredRegister: QbCRegister;
  private readonly _measurement: QbCMeasurement = new QbCMeasurement("B");
  private _cases: Case[];

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  measuredRegisterGroup: FormGroup;

  constructor(treeService: TreeService,
              private dialog: MatDialog, formBuilder: FormBuilder) {
    super(treeService);
    this._measuredRegister = new QbCRegister();
    this._cases = [];

    treeService.deletionNotifier.subscribe(refinement => {
      this._cases.forEach(c => {
        if (c.bodyRefinement === refinement) {
          c.bodyRefinement = undefined;
          c.bodyRefinementRef!.nativeElement.remove();
          c.bodyRefinementRef = undefined;
        }
      })
    });
    treeService.variableSizeChangeNotifier.subscribe(() =>
      this.updateCaseArray(this._measuredRegister.getHilbertSpace(treeService)));

    this.measuredRegisterGroup = formBuilder.group({
      measuredVariables: ""
    });
    this.measuredRegisterGroup.valueChanges.subscribe(changes => {
      this._measuredRegister.updateNames(changes.measuredVariables, treeService);
      this.updateCaseArray(this._measuredRegister.getHilbertSpace(treeService));
    });
  }

  override getTitle(): string {
    return "case";
  }

  override removeVariableUsages() {
    this.treeService.removeVariables(this._measuredRegister.names);
    this._cases.forEach(c => c.bodyRefinement?.removeVariableUsages());
  }

  override export(): any {
    const outline = super.export();
    outline["measuredRegister"] = this._measuredRegister.export();
    outline["measurement"] = this._measurement.export();
    outline["cases"] = this._cases.map(this.exportCase);
    return outline;
  }

  exportCase(c: Case): any {
    return {
      outcome: c.outcome,
      precondition: c.precondition.export(),
      bodyRefinement: c.bodyRefinement ? c.bodyRefinement.export() : null
    }
  }

  chooseRefinement(c: Case): void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const componentRef = this.componentSpawn.createComponent(result);
        const createdSubComponent = componentRef.instance as Refinement;

        this._cases.forEach(c2 => {
          if (c === c2) {
            c2.bodyRefinementRef = componentRef.location;
            c2.bodyRefinement = createdSubComponent;
            if (c2.bodyRefinement) {
              c2.bodyRefinement.precondition = c2.precondition;
              c2.bodyRefinement.postcondition = this.postcondition;
            }
          }
        });
      }
    });
  }

  updateCaseArray(hilbertSpaceDim: number): void {
    if (isNaN(hilbertSpaceDim)) {
      this._cases = [];
      return;
    }

    if (hilbertSpaceDim < this._cases.length) {
      this._cases = this._cases.slice(0, hilbertSpaceDim);
    } else if (hilbertSpaceDim > this._cases.length) {
      const maxStrLength = (hilbertSpaceDim-1).toString(2).length;

      for (let i=0; i<hilbertSpaceDim; i++) {
        let strOutcome = i.toString(2);
        if (strOutcome.length < maxStrLength) {
          strOutcome = "0".repeat(maxStrLength-strOutcome.length) + strOutcome;
        }

        if (i < this._cases.length) {
          this._cases[i].outcome = strOutcome;
        } else {
          this._cases.push({
            outcome: strOutcome,
            precondition: new Condition(this.id, "P"+strOutcome),
            bodyRefinement: undefined,
            bodyRefinementRef: undefined
          });
        }
      }
    }
  }

  get measurement(): QbCMeasurement {
    return this._measurement;
  }

  get cases(): Case[] {
    return this._cases;
  }

  setMeasuredRegisterAndFormGroupValue(value: string): void {
    this.measuredRegisterGroup.setValue({measuredVariables: value});
  }
}

export interface Case {
  outcome: string;
  precondition: Condition;
  bodyRefinement: Refinement | undefined;
  bodyRefinementRef: ElementRef | undefined;
}
