import {AfterViewInit, Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
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
import { MatButtonModule } from '@angular/material/button';
import { Statement } from '../../../../types/statements/statement';
import { SelectionStatement } from '../../../../types/statements/selection-statement';

/**
 * Component in the graphical editor to represent the selection statement
 * @see EditorComponent
 * @see SelectionStatement
 */
@Component({
  selector: 'app-selection-statement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, MatGridListModule, GridTileBorderDirective,
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
    super.precondition.contentChangeObservable.subscribe(content => {
      for (let i = 0; i < this._statements.length; i++) {
        if (this._statements[i]) { 
          this._statements[i]!.precondition.content = "(" + super.precondition.content + ") & (" + this._guards[i].content + ")"
        }
      }
    })

    super.postcondition.contentChangeObservable.subscribe(content => {
      for (let i = 0; i < this._statements.length; i++) {
        if (this._statements[i]) { 
          this._statements[i]!.postcondition.content = super.postcondition.content
        }
      }
    })

  }

  
  override getTitle(): string {
    return "Selection"
  }

  override refreshLinkState(): void {
    super.refreshLinkState()

    for (let i = 0; i < this.statements.length; i++) {
      if (this.statements[i]) {
        this._statements[i]?.refreshLinkState()
      }
    }
  }

  /**
   * 
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

      this._guards[index].contentChangeObservable.subscribe(content => {
        this._statements[index]!.precondition.content = "(" + super.precondition.content + ") & (" + this._guards[index].content + ")"
        this._statements[index]!.postcondition.content = super.postcondition.content
      })

      // Todo: Find better way to refresh the links between the statements
      super.refreshLinkState()
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
    super.refreshLinkState()
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
    setTimeout(() => super.refreshLinkState(), 5)
  }

  get statements() {
    return this._statements
  }

  set guards(guards : Condition[]) {
    this._guards = guards
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

    let indexSelection = this._guards.length - 1
    this._guards[indexSelection].contentChangeObservable.subscribe(content => {
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

  /**
   * Exports all child statements and the state of this component
   * @returns New Instance of Selection Statement with the state in this component
   */
  override export() {

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
      this.precondition,
      this.postcondition,
      super.position,
      // Todo: Save Statement Proven Statement
      false,
      this._guards,
      statements
    )  
  }
}
