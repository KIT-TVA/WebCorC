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
    this._guards = [ new Condition(this.id, "guard #" + 0, "")]
    this._statements = [ undefined ]
    this._statementsElementRefs = []
    treeService.deletionNotifier.subscribe(refinement => {
      const indexOfStatement = this._statements.lastIndexOf(refinement)
      if (indexOfStatement === -1) {
        return
      }
      this._statementsElementRefs[indexOfStatement]!.nativeElement!.remove()
      this._statementsElementRefs[indexOfStatement] = undefined

      for (let i = 0; i < this._statements.length; i++) {
        if (this._statements[i] === refinement) {
          this._statements[i] = undefined
        }
      }
    })
  }

  
  override getTitle(): string {
    return "Selection"
  }

  chooseRefinement(index : number) : void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return 
      }

      const componentRef = this.componentSpawn.createComponent(result);
      const createdSubComponent = componentRef.instance as Refinement;
      this._guards[index] = new Condition(this.id, 'guard #' + (index));
      this._statements[index] = createdSubComponent;
      this._statementsElementRefs[index] = componentRef.location;
      this._statementsElementRefs[index]!.nativeElement!.style.left = "1000px"

      setTimeout(() => super.onDragMoveEmitter.next(), 5)
    })
  }

  addSelection() : void {
    this._guards.push(new Condition(this.id, "guard #" + (this._statements.length), ""))
    this._statements.push(undefined)
    this._statementsElementRefs.push(undefined)
    setTimeout(() => super.onDragMoveEmitter.next(), 5)
  }

  removeSelection() : void {
    console.log('triggered remove Selection')
    if (this._statements.length <= 1) {
      return
    }
    this._guards.pop()
    this._statements.pop()

    console.log(this._statements.length)
    console.log(this._statementsElementRefs.length)

    if (this._statementsElementRefs.length >= this._statements.length) {
      if (this._statementsElementRefs[this._statementsElementRefs.length - 1]) {
        this._statementsElementRefs[this._statementsElementRefs.length - 1]!.nativeElement!.remove()
        this._statementsElementRefs[this._statementsElementRefs.length - 1] = undefined
      }
      this._statementsElementRefs.pop()
      console.log(this._statementsElementRefs)
    }
    setTimeout(() => super.onDragMoveEmitter.next(), 5)
  }

  get statements() {
    return this._statements
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
}
