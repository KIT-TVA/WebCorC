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
import { RepetitionStatement } from '../../../../types/statements/repetition-statement';
import { Position } from '../../../../types/position';

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

  constructor(treeService : TreeService, private dialog : MatDialog) {
    super(treeService);
    this._invariantCondition = new Condition(this.id, "Invariant");
    this._variantCondition = new Condition(this.id, "Variant");
    this._guardCondition = new Condition(this.id, "Guard");
    
    treeService.deletionNotifier.subscribe(refinement => {
      if (refinement === this._loopStatement) {
        this._loopStatement = undefined;
        this._loopStatementRef!.nativeElement!.remove()
      }
    } )
  }

  override getTitle(): string {
    return "Repetition";
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

  set loopStatement(statement : Refinement | undefined) {
    this._loopStatement = statement
  } 

  get loopStatementRef() : ElementRef | undefined {
    return this._loopStatementRef;
  }

  set loopStatementRef(ref : ElementRef | undefined) {
    this._loopStatementRef = ref
  } 

  get invariantCondition() : Condition {
    return this._invariantCondition;
  }

  set invariantCondition(condition : Condition) {
    this._invariantCondition = condition
  }

  get variantCondition() : Condition {
    return this._variantCondition;
  }

  set variantCondition(condition : Condition) {
    this._variantCondition = condition
  }

  get guardCondition() : Condition {
    return this._guardCondition;
  }

  set guardCondition(condition : Condition) {
    this._guardCondition = condition
  }

  override export() {
    return new RepetitionStatement(
      this.getTitle(),
      this.id,
      false,
      "",
      this.precondition,
      this.postcondition,
      new Position(0, 0),
      false,
      false,
      false,
      this.invariantCondition,
      this.variantCondition,
      this.guardCondition,
      this.loopStatement?.export()
    )
  }
}
