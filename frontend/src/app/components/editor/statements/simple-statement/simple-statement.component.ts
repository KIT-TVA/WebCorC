import { Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatementComponent } from "../statement/statement.component";
import { Refinement } from "../../../../types/refinement";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatGridListModule } from "@angular/material/grid-list";
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
import { SimpleStatement } from '../../../../types/statements/simple-statement';
import { Position } from '../../../../types/position';

/**
 * Component representing an instande of {@link SimpleStatement} in the grahical editor.
 * The Root statement is also a simple statement, with one child element
 */
@Component({
    selector: 'app-simple-statement',
    imports: [CommonModule, StatementComponent, MatGridListModule,
        RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, LinkComponent, ConditionEditorComponent],
    templateUrl: './simple-statement.component.html',
    styleUrl: './simple-statement.component.scss'
})
export class SimpleStatementComponent extends Refinement {
  private _statement : Refinement | undefined;
  private _condition : Condition = new Condition(this.id, "Statement");

  private _statementElementRef: ElementRef | undefined;

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) private componentSpawn!: ViewContainerRef;

  public constructor(treeService : TreeService, private dialog: MatDialog ) {
    super(treeService);

    // If root enable the conditions to be edited
    if (this.isRoot()) {
      super.toogleEditableCondition()

      // allow deletion of the child statement
      treeService.deletionNotifier.subscribe(refinement => {
        if (this._statement === refinement) {
          this._statement = undefined
          this._statementElementRef!.nativeElement!.remove();
        }
      })

      treeService.verificationResultNotifier.subscribe((statement) => {
        if (statement.id == this._statement?.id) {
          
        }
      })
    }

    
    

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

  public override getTitle(): string {
    return  this.isRoot() ? "Root" : "Statement";
  }


  public chooseRefinement() : void {
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

  /**
   * 
   * @returns New Instance of SimpleStatement with the state of the component
   */
  public override export() {

    // workaround to ensure the root statement is unique for every cbc formula file  
    if (this.isRoot()) {
      return new SimpleStatement(
        this._condition.content,
        this.id,
        false, 
        "",
        new ConditionDTO(this.precondition.originId, this.precondition.title, this.precondition.content),
        new ConditionDTO(this.postcondition.originId, this.postcondition.title, this.postcondition.content),
        super.position,
        this.statement?.export()
      )
    }
    
    return new SimpleStatement(
      this._condition.content,
      this.id,
      this.proven, 
      "",
      super.precondition.export(),
      super.postcondition.export(),
      super.position,
      this.statement?.export()
    )
  }

  public override refreshLinkState(): void {
    super.refreshLinkState()

    if (this._statement) {
      this._statement.refreshLinkState()
    }
  }

  public override resetPosition(position: Position, offset : Position): void {
    this.position.set(position)
    this.position.add(offset)

    if (this._statement) {
      this._statement.resetPosition(this.position, new Position(100, -10))
    }
  }

  public isRoot() : boolean {
    return this.treeService.isRootNode(this);
  }


  public get statement() : Refinement | undefined {
    return this._statement
  }

  public set statement(statement : Refinement | undefined) {
    this._statement = statement
  }

  public get statementElementRef() {
    return this._statementElementRef
  }

  public set statementElementRef(ref : ElementRef | undefined) {
    this._statementElementRef = ref
  }

  public get condition() : Condition {
    return this._condition
  }

  public set condition(content : string) {
    this._condition.content = content
  }
}
