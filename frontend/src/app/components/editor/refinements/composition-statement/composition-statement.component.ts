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
import { Statement } from '../../../../types/statements/statement';
import { CompositionStatement } from '../../../../types/statements/compositon-statement';

/**
 * Composition statement in the graphical editor.
 * The compositon statement propagates the precondition to the left statement and the postcondition to the right statement.
 * The intermediate condition is the post condition of the left statement and the precondition of the right statement. 
 */
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

  /**
   * Native HTML Elements of the statements, used for visual deletion of the child elements
   */
  private _leftStatementRef : ElementRef | undefined;
  private _rightStatementRef : ElementRef | undefined;

  // Element used to spawn the child statements in
  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  constructor(treeService : TreeService, private dialog : MatDialog) {
    super(treeService);
    this._intermediateCondition = new Condition(this.id, "Intermediate Cond.")

    // Allow deletion of the child elements
    treeService.deletionNotifier.subscribe(refinement => {
      if (this._leftStatement === refinement) {
        this._leftStatement = undefined;
        this._leftStatementRef!.nativeElement!.remove();
        this._leftStatementRef = undefined;
      } else if (this._rightStatement === refinement) {
        this._rightStatement = undefined;
        this._rightStatementRef!.nativeElement!.remove();
        this._rightStatementRef = undefined;
      }
    })

    // Propagate the changes from the precondition to the left statement
    super.precondition.contentChangeObservable.subscribe(content => {
      if (!this._leftStatement) { return }


      this._leftStatement.precondition.content = content
      this._leftStatement.precondition.originId = super.precondition.originId
    })

    // Propagate the changes from the post condition to the right statement
    super.postcondition.contentChangeObservable.subscribe(content => {
      if (!this._rightStatement) { return }

      this._rightStatement.postcondition.content = content
      this._rightStatement.postcondition.originId = super.postcondition.originId
    })

    // Propagate the changes from the intermediate condition to the pre- and postcondition
    // Set the origin id of the pre and post condition to the id of this statement
    this._intermediateCondition.contentChangeObservable.subscribe(content => {
      if (this._leftStatement) {
        this._leftStatement.postcondition.content = content
        this._leftStatement.postcondition.originId = this.id
      }

      if (this._rightStatement) {
        this._rightStatement.precondition.content = content
        this._rightStatement.precondition.originId = this.id
      }
      
    })

  }
  
  override getTitle(): string {
    return "Composition"
  }

  /**
   * Add the child statements chosen by the user in @see ChooseRefinementComponent .
   * The new child statement then get created in component
   * @param side hardcoded string from the template to identify which button got used
   */
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
        this._leftStatement.precondition.content = this.precondition.content
        this._leftStatement.postcondition.content = this._intermediateCondition.content
        this._leftStatement.precondition.originId = this.precondition.originId
        this._leftStatement.postcondition.originId = this.id
      } else {
        this._rightStatementRef = componentRef.location;
        this._rightStatement = createdSubComponent;
        this._rightStatement.precondition.content = this._intermediateCondition.content
        this._rightStatement.postcondition.content = this.postcondition.content
        this._rightStatement.precondition.originId = this.id
        this._rightStatement.postcondition.originId = this.postcondition.originId
      }

      this.treeService.redrawNotifier.next()
    })
  }

  override refreshLinkState(): void {
    super.refreshLinkState()
    
    if (this.leftStatement) {
      this.leftStatement.refreshLinkState()
    }

    if (this.rightStatement) {
      this.rightStatement.refreshLinkState()
    }
  }

  get leftStatement() : Refinement | undefined  {
    return this._leftStatement
  }

  set leftStatement(statement : Refinement | undefined) {
    this._leftStatement = statement
  }

  get leftStatementRef() : ElementRef | undefined {
    return this._leftStatementRef
  }

  set leftStatementRef(ref : ElementRef | undefined) {
    this._leftStatementRef = ref
  } 

  get rightStatement() : Refinement | undefined {
    return this._rightStatement
  }

  set rightStatement(statement : Refinement | undefined) {
    this._rightStatement = statement
  } 

  get rightStatementRef() : ElementRef | undefined {
    return this._rightStatementRef
  }

  set rightStatementRef(ref : ElementRef | undefined) {
    this._rightStatementRef = ref
  }

  get intermediateCondition() : Condition {
    return this._intermediateCondition
  }
  
  set intermediateCondition(condition : Condition) {
    this._intermediateCondition = condition
  } 
 
  /**
   * Converts this component to the data only CompositionStatment @see CompositionStatement
   * @returns a new Instance of CompositionStatment
   */
  override export() : Statement | undefined {
    return new CompositionStatement(
      this.getTitle(),
      this.id,
      // Todo: Save Statement Proven State 
      false,
      // Todo: Implement annotation feature or drop comment attribute 
      "",
      this.precondition,
      this.postcondition,
      this.position,
      this.intermediateCondition,
      this.leftStatement?.export(),
      this.rightStatement?.export()
    )
  }
}
