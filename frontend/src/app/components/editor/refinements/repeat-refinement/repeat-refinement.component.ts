import {Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RefinementComponent} from "../refinement/refinement.component";
import {Refinement} from "../../../../types/refinement";
import {Condition} from "../../../../types/condition/condition";
import {TreeService} from "../../../../services/tree/tree.service";
import {MatDialog} from "@angular/material/dialog";
import {ChooseRefinementComponent} from "../../../choose-refinement/choose-refinement.component";
import {FormalParameter} from "../../../../types/formal-parameter";
import {UpToNumberSet} from "../../../../types/form-spec-values/upToNumberSet";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {GridTileBorderDirective} from "../../../../directives/grid-tile-border.directive";
import {LinkComponent} from "../link/link.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RefinementWidgetComponent} from "../../../../widgets/refinement-widget/refinement-widget.component";

@Component({
  selector: 'app-repeat-refinement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, ConditionEditorComponent, GridTileBorderDirective, LinkComponent, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RefinementWidgetComponent, FormsModule],
  templateUrl: './repeat-refinement.component.html',
  styleUrl: './repeat-refinement.component.scss'
})
export class RepeatRefinementComponent extends Refinement {
  private _parameterizedCondition: Condition;
  iterations: number = 1;
  iterationsFormalParameter: FormalParameter;

  private _bodyRefinement: Refinement | undefined;
  private _bodyRefinementRef: ElementRef | undefined;

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  constructor(treeService: TreeService, private dialog: MatDialog) {
    super(treeService);
    this._parameterizedCondition = new Condition(this.id, "Parameterized Condition");

    treeService.deletionNotifier.subscribe(refinement => {
      if (this.bodyRefinement === refinement) {
        this.bodyRefinement = undefined;
        this.bodyRefinementRef!.nativeElement!.remove();
      }
    });

    if (treeService.hasFormalParameterWithName("j")) {
      let id = 0;
      while (treeService.hasFormalParameterWithName("j"+id)) {
        id++;
      }
      this.iterationsFormalParameter = new FormalParameter("j"+id, new UpToNumberSet(this.iterations));
    } else {
      this.iterationsFormalParameter = new FormalParameter("j", new UpToNumberSet(this.iterations));
    }
    treeService.addFormalParameter(this.iterationsFormalParameter);
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

  changedIterations(event: any): void {
    if (event <= 0) {
      return;
    }
    this.iterations = event;
    this.iterationsFormalParameter = new FormalParameter(this.iterationsFormalParameter.name, new UpToNumberSet(this.iterations));
  }

  override getTitle(): string {
    return "repeat";
  }

  override export(): any {
    const outline = super.export();

    let bodyOutline = null;
    if (this.bodyRefinement) {
      bodyOutline = this.bodyRefinement.export();
    }
    outline["bodyRefinement"] = bodyOutline;

    outline["iterations"] = this.iterations;
    outline["parameterizedCondition"] = this._parameterizedCondition.export();
    outline["iterationsFormalParameter"] = this.iterationsFormalParameter.export();

    return outline;
  }

  override removeVariableUsages() {
    this._bodyRefinement?.removeVariableUsages();
  }

  get parameterizedCondition(): Condition {
    return this._parameterizedCondition;
  }

  get bodyRefinement(): Refinement | undefined {
    return this._bodyRefinement;
  }

  get bodyRefinementRef(): ElementRef | undefined {
    return this._bodyRefinementRef;
  }

  set bodyRefinement(value: Refinement | undefined) {
    this._bodyRefinement = value;
    if (this._bodyRefinement) {
      this._bodyRefinement.precondition = this.parameterizedCondition;
      this._bodyRefinement.postcondition = this.parameterizedCondition;
    }
  }

  set bodyRefinementRef(value: ElementRef | undefined) {
    this._bodyRefinementRef = value;
  }
}
