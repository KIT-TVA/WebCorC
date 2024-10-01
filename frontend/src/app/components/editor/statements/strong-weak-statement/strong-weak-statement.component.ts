import {Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import {StatementComponent} from "../statement/statement.component";
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
import { StrongWeakStatement } from '../../../../types/statements/strong-weak-statement';

/**
 * Component in the graphic editor representing {@link StrongWeakStatement}
 */
@Component({
  selector: 'app-strong-weak-statement',
  standalone: true,
  imports: [CommonModule, StatementComponent, MatGridListModule, GridTileBorderDirective,
    RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, LinkComponent],
  templateUrl: './strong-weak-statement.component.html',
  styleUrl: './strong-weak-statement.component.scss'
})
export class StrongWeakStatementComponent extends Refinement {
  private _weakPreCondition : Condition;
  private _strongPostCondition : Condition;
  
  private _statement : Refinement | undefined;
  private _statementRef : ElementRef | undefined;

  @ViewChild("subComponentSpawn", {read: ViewContainerRef}) componentSpawn!: ViewContainerRef;

  constructor(treeService : TreeService, private dialog : MatDialog) {
    super(treeService);
    this._weakPreCondition = new Condition(this.id, "Weak precondition");
    this._strongPostCondition = new Condition(this.id, "Strong postcondition");

    // delete the child statement on deletion
    treeService.deletionNotifier.subscribe(refinement => {
      if (refinement === this._statement) {
        this._statement = undefined;
        this._statementRef!.nativeElement!.remove();
      }
    })

    // propagate the changes of the weak precondition to the precondition of the child
    this._weakPreCondition.contentChangeObservable.subscribe(() => {
      if (!this._statement) { return }

      this._statement.precondition.content = this._weakPreCondition.content
      this._statement.precondition.originId = this.id
    })

    // propagate the changes of the strong postcondition to the postcondition of the child
    this._strongPostCondition.contentChangeObservable.subscribe(() => {
      if (!this._statement) { return }

      this._statement.postcondition.content = this._strongPostCondition.content
      this._statement.precondition.originId = this.id
    })
  }
  
  override getTitle(): string {
    return "Strong-Weak"
  }

  /**
   * Open {@link ChooseRefinementComponent} and allow adding a child to this statement
   */
  chooseRefinement() {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) { return }

      const componentRef = this.componentSpawn.createComponent(result)
      const createdSubComponent = componentRef.instance as Refinement

      this._statementRef = componentRef.location;
      this._statement = createdSubComponent;
      this._statement.precondition.content = this.weakPreCondition.content
      this._statement.postcondition.content = this.strongPostCondition.content

      this.treeService.redrawNotifier.next()
    })
  }

  get statement() : Refinement | undefined {
    return this._statement
  }

  set statement(statement : Refinement | undefined) {
    this._statement = statement
  }

  get statementRef() : ElementRef | undefined {
    return this._statementRef
  }

  set statementRef(ref : ElementRef | undefined) {
    this._statementRef = ref
  }


  get weakPreCondition() : Condition {
    return this._weakPreCondition
  }

  get strongPostCondition() : Condition {
    return this._strongPostCondition;
  }

  /**
   * Convert this Component to the data only {@link StrongWeakStatement}
   * @returns 
   */
  override export() {
    return new StrongWeakStatement(
      this.getTitle(),
      this.id,
      false, 
      "",
      this._weakPreCondition.export(),
      this._strongPostCondition.export(),
      super.position,
      this.statement?.export()
    )
  }

  /**
   * Refresh the link between this and the child statement
   */
  override refreshLinkState(): void {
    super.refreshLinkState()
    if (!this._statement) return
    this.statement?.refreshLinkState()
  }
}
