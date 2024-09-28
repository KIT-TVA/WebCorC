import { Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatementComponent } from "../statement/statement.component";
import { Refinement } from "../../../../types/refinement";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatGridListModule } from "@angular/material/grid-list";
import { GridTileBorderDirective } from "../../../../directives/grid-tile-border.directive";
import { RefinementWidgetComponent } from "../../../../widgets/refinement-widget/refinement-widget.component";
import { ConditionEditorComponent } from "../../condition/condition-editor/condition-editor.component";
import { Condition } from "../../../../types/condition/condition";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialog } from "@angular/material/dialog";
import { ChooseRefinementComponent } from "../../../choose-refinement/choose-refinement.component";
import { MatIconModule } from "@angular/material/icon";
import { LinkComponent } from "../link/link.component";
import { SimpleStatement } from '../../../../types/statements/simple-statement';

/**
 * Component representing a simple statement in the grahical editor.
 * The Root statement is also a simple statement, with one child element
 * @see EditorComponent
 * @see SimpleStatement
 */
@Component({
  selector: 'app-simple-statement',
  standalone: true,
  imports: [CommonModule, StatementComponent, MatGridListModule, GridTileBorderDirective,
    RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, LinkComponent, ConditionEditorComponent],
  templateUrl: './simple-statement.component.html',
  styleUrl: './simple-statement.component.scss'
})
export class SimpleStatementComponent extends Refinement {
  private _statement : Refinement | undefined;
  private _condition : Condition = new Condition(this.id, "Statement");

  private _statementElementRef: ElementRef | undefined;

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  constructor(treeService : TreeService, private dialog: MatDialog ) {
    super(treeService);

    if (this.isRoot()) {
      super.toogleEditableCondition()
    }

    treeService.deletionNotifier.subscribe(refinement => {
      if (this._statement === refinement) {
        this._statement = undefined
        this._statementElementRef!.nativeElement!.remove();
      }
    })

    super.precondition.contentChangeObservable.subscribe(content => {
      if (!this._statement) { return }

      this._statement.precondition.content = content
      this._statement.precondition.originId = this.id
    })

    super.postcondition.contentChangeObservable.subscribe(content => {
      if (!this._statement) { return }

      this._statement.postcondition.content = content
      this._statement.postcondition.originId = this.id
    })
  }

  override getTitle(): string {
    return  this.isRoot() ? "Root" : "Statement";
  }


  chooseRefinement() : void {
    if (!this.isRoot()) {
      return
    } 

    const dialogRef = this.dialog.open(ChooseRefinementComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return 
      }

      const componentRef = this.componentSpawn.createComponent(result);
      const createdSubComponent = componentRef.instance as Refinement;

      this._statement = createdSubComponent;
      this._statementElementRef = componentRef.location;
      this._statement.precondition.content = this.precondition.content
      this._statement.postcondition.content = this.postcondition.content
      this.treeService.redrawNotifier.next()
    })
  }

  


  get statement() : Refinement | undefined {
    return this._statement
  }

  set statement(statement : Refinement | undefined) {
    this._statement = statement
  }

  get statementElementRef() {
    return this._statementElementRef
  }

  set statementElementRef(ref : ElementRef | undefined) {
    this._statementElementRef = ref
  }

  public isRoot() : boolean {
    return this.treeService.isRootNode(this);
  }

  get condition() : Condition {
    return this._condition
  }

  set condition(content : string) {
    this._condition.content = content
  }

  /**
   * 
   * @returns New Instance of SimpleStatement with the state of the component
   */
  override export() {

    // workaround to ensure the root statement is unique for every cbc formula file  
    if (this.isRoot()) {
      return new SimpleStatement(
        this._condition.content,
        this.id,
        false, 
        "",
        new Condition(this.precondition.originId, this.precondition.title, this.precondition.content),
        new Condition(this.postcondition.originId, this.postcondition.title, this.postcondition.content),
        super.position,
        this.statement?.export()
      )
    }
    
    return new SimpleStatement(
      this._condition.content,
      this.id,
      false, 
      "",
      super.precondition,
      super.postcondition,
      super.position,
      this.statement?.export()
    )
  }

  override refreshLinkState(): void {
    super.refreshLinkState()

    if (this._statement) {
      this._statement.refreshLinkState()
    }
  }

}
