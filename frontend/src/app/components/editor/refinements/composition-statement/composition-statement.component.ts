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
  selector: 'app-composition-statement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, MatGridListModule, GridTileBorderDirective,
    RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, LinkComponent],
  templateUrl: './composition-statement.component.html',
  styleUrl: './composition-statement.component.scss'
})
export class CompositionStatementComponent extends Refinement {
  private _leftStatement : Refinement | undefined;
  private _rightStatement : Refinement | undefined;
  private _intermediateCondition : Condition;

  private _leftStatementRef : ElementRef | undefined;
  private _rightStatementRef : ElementRef | undefined;
  
  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  constructor(treeService : TreeService, private dialog : MatDialog) {
    super(treeService);
    this._intermediateCondition = new Condition(this.id, "Intermediate Cond.")

    treeService.deletionNotifier.subscribe(refinement => {
      if (this._leftStatement === refinement) {
        this._leftStatement = undefined;
        this._leftStatementRef!.nativeElement!.remove();
      } else if (this._rightStatement === refinement) {
        this._rightStatement = undefined;
        this._rightStatementRef!.nativeElement!.remove();
      }
    })
  }
  
  override getTitle(): string {
    return "Composition"
  }


  chooseRefinement(side : "left" | "right") : void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return
      }

      const componentRef = this.componentSpawn.createComponent(result);
      const createdSubComponent = componentRef.instance as Refinement;

      if (side === "left") {
        this._leftStatementRef = componentRef.location;
        this._leftStatement = createdSubComponent;
      } else {
        this._rightStatementRef = componentRef.location;
        this._rightStatement = createdSubComponent;
      }

    })
  }

  get leftStatement() : Refinement | undefined  {
    return this._leftStatement
  }

  get leftStatementRef() : ElementRef | undefined {
    return this._leftStatementRef
  }

  get rightStatement() : Refinement | undefined {
    return this._rightStatement
  }

  get rightStatementRef() : ElementRef | undefined {
    return this._rightStatementRef
  }

  get intermediateCondition() : Condition {
    return this._intermediateCondition
  }
 
}