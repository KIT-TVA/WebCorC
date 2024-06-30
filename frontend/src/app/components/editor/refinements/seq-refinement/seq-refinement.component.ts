import {Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RefinementComponent} from "../refinement/refinement.component";
import {Refinement} from "../../../../types/refinement";
import {TreeService} from "../../../../services/tree/tree.service";
import {MatGridListModule} from "@angular/material/grid-list";
import {GridTileBorderDirective} from "../../../../directives/grid-tile-border.directive";
import {RefinementWidgetComponent} from "../../../../widgets/refinement-widget/refinement-widget.component";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {Condition} from "../../../../types/condition/condition";
import {FormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDialog} from "@angular/material/dialog";
import {ChooseRefinementComponent} from "../../../choose-refinement/choose-refinement.component";
import {MatIconModule} from "@angular/material/icon";
import {LinkComponent} from "../link/link.component";

@Component({
  selector: 'app-seq-refinement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, MatGridListModule, GridTileBorderDirective,
    RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, LinkComponent],
  templateUrl: './seq-refinement.component.html',
  styleUrl: './seq-refinement.component.scss'
})
export class SeqRefinementComponent extends Refinement {
  private _leftHandRefinement: Refinement | undefined;
  private _rightHandRefinement: Refinement | undefined;
  private _intermediateCondition: Condition;

  private _leftHandElementRef: ElementRef | undefined;
  private _rightHandElementRef: ElementRef | undefined;

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  constructor(treeService: TreeService, private dialog: MatDialog) {
    super(treeService);
    this._intermediateCondition = new Condition(this.id, "Intermediate Cond.");

    treeService.deletionNotifier.subscribe(refinement => {
      if (this.leftHandRefinement === refinement) {
        this.leftHandRefinement = undefined;
        this.leftHandElementRef!.nativeElement!.remove();
        //this.componentSpawn.remove(this.componentSpawn.indexOf(this.leftHandElementRef!.nativeElement));
      } else if (this.rightHandRefinement === refinement) {
        this.rightHandRefinement = undefined;
        this.rightHandElementRef!.nativeElement!.remove();
        //this.componentSpawn.remove(this.componentSpawn.indexOf(this.rightHandElementRef!.nativeElement));
      }
    });
  }

  chooseRefinement(side: "left" | "right"): void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const componentRef = this.componentSpawn.createComponent(result);
        const createdSubComponent = componentRef.instance as Refinement;

        if (side === "left") {
          this._leftHandElementRef = componentRef.location;
          this.leftHandRefinement = createdSubComponent;
        } else {
          this._rightHandElementRef = componentRef.location;
          this.rightHandRefinement = createdSubComponent;
        }
      }
    });
  }

  getTitle(): string {
    return "seq";
  }

  override removeVariableUsages() {
    this._leftHandRefinement?.removeVariableUsages();
    this._rightHandRefinement?.removeVariableUsages();
  }

  override export(): any {
    const outline = super.export();

    let outlineLeft = null;
    if (this.leftHandRefinement) {
      outlineLeft = this.leftHandRefinement.export();
    }
    outline["leftHandRefinement"] = outlineLeft;

    let outlineRight = null;
    if (this.rightHandRefinement) {
      outlineRight = this.rightHandRefinement.export();
    }
    outline["rightHandRefinement"] = outlineRight;
    outline["intermediateCondition"] = this.intermediateCondition.export();

    return outline;
  }

  get leftHandRefinement(): Refinement | undefined {
    return this._leftHandRefinement;
  }

  get rightHandRefinement(): Refinement | undefined {
    return this._rightHandRefinement;
  }

  get intermediateCondition(): Condition {
    return this._intermediateCondition;
  }

  get leftHandElementRef(): ElementRef | undefined {
    return this._leftHandElementRef;
  }

  get rightHandElementRef(): ElementRef | undefined {
    return this._rightHandElementRef;
  }

  set leftHandRefinement(value: Refinement | undefined) {
    this._leftHandRefinement = value;
    if (this._leftHandRefinement) {
      this._leftHandRefinement.precondition = this.precondition;
      this._leftHandRefinement.postcondition = this.intermediateCondition;
    }
  }

  set rightHandRefinement(value: Refinement | undefined) {
    this._rightHandRefinement = value;
    if (this._rightHandRefinement) {
      this._rightHandRefinement.precondition = this.intermediateCondition;
      this._rightHandRefinement.postcondition = this.postcondition;
    }
  }

  setIntermediateConditionContent(content: string) {
    this.intermediateCondition.content = content;
  }

  set leftHandElementRef(value: ElementRef | undefined) {
    this._leftHandElementRef = value;
  }

  set rightHandElementRef(value: ElementRef | undefined) {
    this._rightHandElementRef = value;
  }
}
