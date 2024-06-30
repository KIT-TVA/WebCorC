import {Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Refinement} from "../../../../types/refinement";
import {TreeService} from "../../../../services/tree/tree.service";
import {RefinementComponent} from "../refinement/refinement.component";
import {LinkComponent} from "../link/link.component";
import {RefinementWidgetComponent} from "../../../../widgets/refinement-widget/refinement-widget.component";
import {ChooseRefinementComponent} from "../../../choose-refinement/choose-refinement.component";
import {MatDialog} from "@angular/material/dialog";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {Condition} from "../../../../types/condition/condition";

@Component({
  selector: 'app-sw-refinement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, LinkComponent, RefinementWidgetComponent, ConditionEditorComponent],
  templateUrl: './sw-refinement.component.html',
  styleUrl: './sw-refinement.component.scss'
})
export class SwRefinementComponent extends Refinement {
  private _weakenedPrecondition: Condition;
  private _strengthenedPostcondition: Condition;
  private _bodyRefinement: Refinement | undefined;

  private _bodyRefinementRef: ElementRef | undefined;

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  constructor(treeService: TreeService, private dialog: MatDialog) {
    super(treeService);
    this._weakenedPrecondition = new Condition(this.id,"Weakened Pre");
    this._strengthenedPostcondition = new Condition(this.id,"Strengthened Post");

    treeService.deletionNotifier.subscribe(refinement => {
      if (this._bodyRefinement === refinement) {
        this._bodyRefinement = undefined;
        this._bodyRefinementRef!.nativeElement.remove();
        this._bodyRefinementRef = undefined;
      }
    });
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

  override getTitle(): string {
    return "sw";
  }

  override removeVariableUsages() {
    this._bodyRefinement?.removeVariableUsages();
  }

  override export(): any {
    const outline = super.export();
    outline["weakenedPrecondition"] = this._weakenedPrecondition.export();
    outline["strengthenedPostcondition"] = this._strengthenedPostcondition.export();

    let outlineBody = null;
    if (this._bodyRefinement) {
      outlineBody = this._bodyRefinement.export();
    }
    outline["bodyRefinement"] = outlineBody;
    return outline;
  }

  get bodyRefinement(): Refinement | undefined {
    return this._bodyRefinement;
  }

  get bodyRefinementRef(): ElementRef | undefined {
    return this._bodyRefinementRef;
  }

  get weakenedPrecondition(): Condition {
    return this._weakenedPrecondition;
  }

  get strengthenedPostcondition(): Condition {
    return this._strengthenedPostcondition;
  }

  set bodyRefinement(value: Refinement | undefined) {
    this._bodyRefinement = value;
    if (this._bodyRefinement) {
      this._bodyRefinement.precondition = this.weakenedPrecondition;
      this._bodyRefinement.postcondition = this.strengthenedPostcondition;
    }
  }

  set bodyRefinementRef(value: ElementRef | undefined) {
    this._bodyRefinementRef = value;
  }
}
