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
  selector: 'app-strong-weak-statement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, MatGridListModule, GridTileBorderDirective,
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

    treeService.deletionNotifier.subscribe(refinement => {
      if (refinement === this._statement) {
        this._statement = undefined;
        this._statementRef!.nativeElement!.remove();
      }
    })
  }
  
  override getTitle(): string {
    return "Strong-Weak"
  }

  chooseRefinement() {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) { return }

      const componentRef = this.componentSpawn.createComponent(result);
      const createdSubComponent = componentRef.instance as Refinement;

      this._statementRef = componentRef.location;
      this._statement = createdSubComponent;
    })
  }

  get statement() : Refinement | undefined {
    return this._statement
  }

  get statementRef() : ElementRef | undefined {
    return this._statementRef
  }

  get weakPreCondition() : Condition {
    return this._weakPreCondition
  }

  get strongPostCondition() : Condition {
    return this._strongPostCondition;
  }



}