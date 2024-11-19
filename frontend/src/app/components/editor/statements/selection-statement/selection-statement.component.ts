import { Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatementComponent } from "../statement/statement.component";
import { Refinement } from "../../../../types/refinement";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatGridListModule } from "@angular/material/grid-list";
import { GridTileBorderDirective } from "../../../../directives/grid-tile-border.directive";
import { RefinementWidgetComponent } from "../../../../widgets/refinement-widget/refinement-widget.component";
import { ConditionEditorComponent } from "../../condition/condition-editor/condition-editor.component";
import { Condition, ConditionDTO } from "../../../../types/condition/condition";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialog } from "@angular/material/dialog";
import { ChooseRefinementComponent } from "../../../choose-refinement/choose-refinement.component";
import { MatIconModule } from "@angular/material/icon";
import { LinkComponent } from "../link/link.component";
import { MatButtonModule } from '@angular/material/button';
import { Statement } from '../../../../types/statements/statement';
import { SelectionStatement } from '../../../../types/statements/selection-statement';
import { Position } from '../../../../types/position';

/**
 * Component in the graphical editor to represent the {@link SelectionStatement}
 * The Selectionstatement has n child statements and n guard statements.
 * The guard conditons and the precondition get propagated to the precondition
 * of the child.
 */
@Component({
  selector: 'app-selection-statement',
  standalone: true,
  imports: [CommonModule, StatementComponent, MatGridListModule, GridTileBorderDirective,
    RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, LinkComponent, ConditionEditorComponent],
  templateUrl: './selection-statement.component.html',
  styleUrl: './selection-statement.component.scss'
})
export class SelectionStatementComponent extends Refinement {
  private _statements : (Refinement | undefined )[]
  private _guards : Condition[]

  private _statementsElementRefs : (ElementRef | undefined )[]

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;
  
  constructor(treeService : TreeService, private dialog : MatDialog) {
    super(treeService)

    // ensure at least one element is in the array to ensure rendering without errors
    this._guards = [ new Condition(this.id, "guard #" + 0, "")]
    this._statements = [ undefined ]
    this._statementsElementRefs = []

    // delete the child statement and all references
    treeService.deletionNotifier.subscribe(refinement => {
      const indexOfStatement = this._statements.lastIndexOf(refinement)

      if (indexOfStatement === -1) {
        return
      }

      this._statementsElementRefs[indexOfStatement]!.nativeElement!.remove()
      this._statementsElementRefs[indexOfStatement] = undefined
      this._statements[indexOfStatement] = undefined
    })

    // propgate changes of the preconditon and guard condition to the childs
    super.precondition.contentChangeObservable.subscribe(() => {
      for (let i = 0; i < this._statements.length; i++) {
        if (this._statements[i]) { 
          this._statements[i]!.precondition.content = "(" + super.precondition.content + ") & (" + this._guards[i].content + ")"
          this._statements[i]!.precondition.originId = this.id
        }
      }
    })

    super.postcondition.contentChangeObservable.subscribe(() => {
      for (let i = 0; i < this._statements.length; i++) {
        if (this._statements[i]) { 
          this._statements[i]!.postcondition.content = super.postcondition.content
          this._statements[i]!.postcondition.originId = super.postcondition.originId
        }
      }
    })

  }

  
  override getTitle(): string {
    return "Selection"
  }

  /**
   * Refresh the link state of this statement and all child statements
   */
  override refreshLinkState(): void {
    super.refreshLinkState()

    for (let i = 0; i < this.statements.length; i++) {
      if (this.statements[i]) {
        this._statements[i]?.refreshLinkState()
      }
    }
  }

  override resetPosition(position: Position): void {
      this.position = position

      for (let i = 0; i < this._statements.length; i++) {
        if (this.statements) {
          this._statements[i]?.resetPosition(new Position(position.xinPx + 200 * (i + 1), position.yinPx + 200 * (i + 1)))
        }
      }
  }

  /**
   * Open {@link ChooseRefinementComponent} and add the child statement according to the 
   * index of the guard to add the statement to.
   * @param index The position to add the statement
   */
  chooseRefinement(index : number) : void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return 
      }

      const componentRef = this.componentSpawn.createComponent(result);
      const createdSubComponent = componentRef.instance as Refinement;
      this._statements[index] = createdSubComponent;
      this._statementsElementRefs[index] = componentRef.location;
      this._statementsElementRefs[index]!.nativeElement!.style.left = "1000px"

      this._statements[index]!.precondition.content = "(" + super.precondition.content + ") & (" + this._guards[index].content + ")"
      this._statements[index]!.postcondition.content = super.postcondition.content

      this._guards[index].contentChangeObservable.subscribe(() => {
        this._statements[index]!.precondition.content = "(" + super.precondition.content + ") & (" + this._guards[index].content + ")"
        this._statements[index]!.postcondition.content = super.postcondition.content
      })

      setTimeout(() => this.refreshLinkState(), 5)
    })
  }

  /**
   * Add a new selection to to the selection statement
   * and ensure the correct length of the statment arrays
   */
  addSelection() : void {
    this._guards.push(new Condition(this.id, "guard #" + (this._statements.length), ""))
    this._statements.push(undefined)
    this._statementsElementRefs.push(undefined)
    this.treeService.redrawNotifier.next()
  }

  /**
   * Remove the last selection.
   * Ensures the minimum length to be 1
   * If there are connected child statements to the to be deleted selection
   * remove the child statements
   */
  removeSelection() : void {
    if (this._statements.length <= 1) {
      return
    }
    this._guards.pop()
    this._statements.pop()

    if (this._statementsElementRefs.length >= this._statements.length) {
      if (this._statementsElementRefs[this._statementsElementRefs.length - 1]) {
        this._statementsElementRefs[this._statementsElementRefs.length - 1]!.nativeElement!.remove()
        this._statementsElementRefs[this._statementsElementRefs.length - 1] = undefined
      }
      this._statementsElementRefs.pop()
    }
    setTimeout(() => this.refreshLinkState(), 5)
  }

  /**
   * Import the Selections from the file @see ProjectService
   * @param selection The selection to be imported
   * @param ref the html element of the child statement
   */
  importSelection(selection : Refinement | undefined, ref : ElementRef | undefined) {
    if (this._statements[0] == undefined) {
      this._guards[0] = new Condition(this.id, "guard #" + (this._statements.length), "")
      this._statements[0] = selection
      this._statementsElementRefs[0] = ref
      return
    }

    this._guards.push(new Condition(this.id, "guard #" + (this._statements.length), ""))
    this._statements.push(selection)
    this._statementsElementRefs.push(ref)

    const indexSelection = this._guards.length - 1
    this._guards[indexSelection].contentChangeObservable.subscribe(() => {
      this._statements[indexSelection]!.precondition.content = "(" + super.precondition.content + ") & (" + this._guards[indexSelection].content + ")"
      this._statements[indexSelection]!.postcondition.content = super.postcondition.content
    })
    
  }

  getStatementByIndex(index : number) : Refinement {
    return this._statements[index] as Refinement
  }
   
  getStatementElementsRefByIndex(index : number) : ElementRef {
    return this._statementsElementRefs[index] as ElementRef
  }

  getGuardByIndex(index : number) : Condition {
    return this._guards[index] as Condition
  }

  get statements() {
    return this._statements
  }

  set guards(guards : Condition[]) {
    this._guards = guards
  }

  /**
   * Exports all child statements and the state of this component
   * @returns New Instance of Selection Statement with the state in this component
   */
  override export() {

    const guards : ConditionDTO[] = []

    for (const guard of this._guards) {
      guards.push(guard.export())
    }

    const statements : (Statement | undefined)[] = []
    for (const statement of this._statements) {
      if (statement) {
        statements.push(statement.export())
      }
    }

    return new SelectionStatement(
      this.getTitle(),
      this.id,
      // Todo: Save Statement Proven Statement
      false,
      // Todo: Implement annotation feature or drop comment attribute 
      "",
      this.precondition.export(),
      this.postcondition.export(),
      super.position,
      // Todo: Save Statement Proven Statement
      false,
      guards,
      statements
    )  
  }
}
