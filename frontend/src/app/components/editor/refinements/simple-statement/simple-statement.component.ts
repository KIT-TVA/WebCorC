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

@Component({
  selector: 'app-simple-statement',
  standalone: true,
  imports: [CommonModule, RefinementComponent, MatGridListModule, GridTileBorderDirective,
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

    treeService.deletionNotifier.subscribe(refinement => {
      if (this._statement === refinement) {
        this._statement = undefined
        this._statementElementRef!.nativeElement!.remove();
      }
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
    })
  }

  


  get statement() : Refinement | undefined {
    return this._statement
  }

  get statementElementRef() {
    return this._statementElementRef
  }

  public isRoot() : boolean {
    return this.treeService.isRootNode(this);
  }

  get condition() : Condition {
    return this._condition
  }

}
