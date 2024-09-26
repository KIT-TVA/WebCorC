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

/**
 * Compoent in the Graphical Editor to represent a repetition statement
 * @see RepetitionStatement
 */
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
    
    // ensure to delete the loopStatement, when deleting
    treeService.deletionNotifier.subscribe(refinement => {
      if (refinement === this._loopStatement) {
        this._loopStatement = undefined;
        this._loopStatementRef!.nativeElement!.remove()
      }
    })

   /**
    * Todo: Find better fix for stopping the precondition propagation from the parent
    * to this type of statement.
    * Following lines forces the content to be correct, but the users sees the content of 
    * the precondition for a split second
    */
    super.precondition.contentChangeObservable.subscribe(content => {
      super.precondition.content = "((" + this._invariantCondition.content + ") & (" + this._guardCondition.content + "))"
    })

    /**
     * Propagate the changes of the invariant conditon to the pre- and postcondition of this and the loop 
     * statement
     */
    this._invariantCondition.contentChangeObservable.subscribe(content => {
      super.precondition.content = "((" + this._invariantCondition.content + ") & (" + this._guardCondition.content + "))"
      super.postcondition.content = "(" + this._invariantCondition.content + ")"

      if (this._loopStatement) {
        this._loopStatement.precondition.content = super.precondition.content
      }

      if (this._loopStatement) {
        this._loopStatement.postcondition.content = super.postcondition.content
      }
    })


    this._guardCondition.contentChangeObservable.subscribe(content => {
      super.precondition.content = "((" + this._invariantCondition.content + ") & (" + this._guardCondition.content + "))"
      
      if (this._loopStatement) {
        this._loopStatement.precondition.content = super.precondition.content
      }
    })
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
      this._loopStatement.precondition.content = super.precondition.content
      this._loopStatement.postcondition.content = super.postcondition.content

      this.treeService.redrawNotifier.next()
    })
  }

  override refreshLinkState(): void {
    super.refreshLinkState()
    if (!this.loopStatement) return
    this.loopStatement.refreshLinkState()
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

  /**
   * Save the state of this component to the corresponding data only class 
   * @see RepetitionStatement
   * @returns New Instance of data only Repetition Statement class
   */
  override export() {
    return new RepetitionStatement(
      this.getTitle(),
      this.id,
      // Todo: Save Statement Proven Statement
      false,
      // Todo: Implement annotation feature or drop comment attribute 
      "",
      this.precondition,
      this.postcondition,
      super.position,
      // Todo: Save Statement Proven Statement
      false,
      // Todo: Save Statement Proven Statement
      false,
      // Todo: Save Statement Proven Statement
      false,
      this.invariantCondition,
      this.variantCondition,
      this.guardCondition,
      this.loopStatement?.export()
    )
  }
}
