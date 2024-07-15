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
  selector: 'app-repetition-statement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, MatGridListModule, GridTileBorderDirective,
    RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, LinkComponent],
  templateUrl: './repetition-statement.component.html',
  styleUrl: './repetition-statement.component.scss'
})
export class RepetitionStatementComponent extends Refinement {
  private _invariantCondition : Condition;
  private _guardCondition : Condition;
  private _variantCondition : Condition;

  private _loopStatement : Refinement | undefined;
  private _loopStatementRef : ElementRef | undefined;

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;
  
  
  override getTitle(): string {
    return "Repetition";
  }

  constructor(treeService : TreeService, private dialog : MatDialog) {
    super(treeService);
    this._invariantCondition = new Condition(this.id, "Invariant")
    this._variantCondition = new Condition(this.id, "Variant")
    this._guardCondition = new Condition(this.id, "Guard")
  }

  chooseRefinement() {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);
    
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return
      }

      const componentRef = this.componentSpawn.createComponent(result);
      const createdSubComponent = componentRef.instance as Refinement;

      this._loopStatementRef = componentRef.location;
      this._loopStatement = createdSubComponent;
    })
  }


  get loopStatement() : Refinement | undefined {
    return this._loopStatement;
  }

  get loopStatementRef() : ElementRef | undefined {
    return this._loopStatementRef;
  }

  get invariantCondition() : Condition {
    return this._invariantCondition;
  }

  get variantCondition() : Condition {
    return this._variantCondition;
  }

  get guardCondition() : Condition {
    return this._guardCondition;
  }
 


}
