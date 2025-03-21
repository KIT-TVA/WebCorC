import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatGridListModule} from "@angular/material/grid-list";
import {Refinement} from "../../../../types/refinement";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {GridTileBorderDirective} from "../../../../directives/grid-tile-border.directive";
import {CdkDrag, CdkDragEnd, CdkDragHandle, CdkDragMove, Point} from "@angular/cdk/drag-drop";
import {TreeService} from "../../../../services/tree/tree.service";
import {MatIconModule} from "@angular/material/icon";
import {MatDrawer, MatSidenavModule} from "@angular/material/sidenav";
import {MatButtonModule} from "@angular/material/button";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatListModule} from "@angular/material/list";
import { Position } from '../../../../types/position';
import { Statement } from '../../../../types/statements/statement';

/**
 * Component to present the statements.
 * This component is only to show the statement given.
 * It is used as the template for the statements.
 * This is not the (super) type Refinement.
 */
@Component({
    selector: 'app-statement-base',
    imports: [CommonModule, MatGridListModule, MatFormFieldModule, MatInputModule, FormsModule,
        ConditionEditorComponent, GridTileBorderDirective, CdkDrag,
        CdkDragHandle, MatIconModule, MatSidenavModule, MatButtonModule, MatExpansionModule,
        MatListModule],
    templateUrl: './statement.component.html',
    styleUrl: './statement.component.scss'
})
export class StatementComponent implements AfterViewInit {
  private static readonly EDITOR_CONTAINER_EXPANSION_TRIGGER = 150;
  private static readonly EDITOR_CONTAINER_EXPANSION = 200;

  @Input() public refinement!: Refinement;

  @ViewChild("preconditionDrawer") private preconditionDrawer!: MatDrawer;
  @ViewChild("postconditionDrawer") private postconditionDrawer!: MatDrawer;
  @ViewChild("preconditionDiv") private preconditionDivRef!: ElementRef;
  @ViewChild("postconditionDiv") private postconditionDivRef!: ElementRef;
  @ViewChild("refinementBox") private refinementBoxRef!: ElementRef;
  @ViewChild("boxTitle") private boxTitleRef!: ElementRef;

  // position of the element in the drag and drop area
  private _dragPosition : Point = {x:0, y: 0}

  constructor(private treeService: TreeService) {}

  public ngAfterViewInit(): void {

    // set the position to the saved position in the file
    this.refreshDragPosition()

    if (this.refinement.isPreconditionEditable()) {
      this.toggleConditionEditorView(false);
    }
    if (this.refinement.isPostConditionEditable()) {
      this.toggleConditionEditorView(true);
    }

    this.treeService.verificationResultNotifier.subscribe(
      verificationResult => this.setVerifcationState(verificationResult));

    if (this.isRoot()) {
      this.refinement.getRedrawNotifier().subscribe(() => {
        this.refreshDragPosition()
      })

      this.treeService.resetVerifyNotifier.subscribe(() => {
        if (!this.refinement.proven) {
          this.boxTitleRef.nativeElement.style.backgroundColor = "rgb(87, 87, 87)";
          this.refinementBoxRef.nativeElement.style.borderColor = "rgb(87, 87, 87)";
        }
      })
    }

    if (this.refinement.proven) {
      this.boxTitleRef.nativeElement.style.backgroundColor = "rgb(140,182,60)";
      this.refinementBoxRef.nativeElement.style.borderColor = "rgb(140,182,60)";
    }
  }

  public deleteRefinement(): void {
    this.treeService.deletionNotifier.next(this.refinement);
  }

  public onDragMoved(move: CdkDragMove): void {
    this.refinement.onDragMoveEmitter.next();
    this.expandEditorContainer(move);
  }

  public refreshDragPosition() : void {
    this._dragPosition = {x : this.refinement.position.xinPx, y: this.refinement.position.yinPx}
  }

  /**
   * Expands the editor container, when a refinement box is dragged to the editor containers right or bottom border.
   * @param move event fired through a users drag.
   */
  public expandEditorContainer(move: CdkDragMove): void {
    const boxPosition = move.source.element.nativeElement.getBoundingClientRect();
    const editorContainer = document.getElementById("editorContainer");
    const widthController = document.getElementById("editorWidthController");
    const heightController = document.getElementById("editorHeightController");
    if (editorContainer && widthController && heightController) {
      if (boxPosition.x + boxPosition.width + editorContainer.scrollLeft >=
          editorContainer.scrollWidth - StatementComponent.EDITOR_CONTAINER_EXPANSION_TRIGGER) {
        widthController.style.width = editorContainer.scrollWidth+StatementComponent.EDITOR_CONTAINER_EXPANSION + "px";
      }
      if (boxPosition.y + boxPosition.height + editorContainer.scrollTop >=
          editorContainer.scrollHeight - StatementComponent.EDITOR_CONTAINER_EXPANSION_TRIGGER) {
        heightController.style.height = editorContainer.scrollHeight + StatementComponent.EDITOR_CONTAINER_EXPANSION + "px";
      }
    }
  }

  public toggleConditionEditorView(postcondition: boolean): void {
    let drawer = this.preconditionDrawer;
    let editorRef = this.preconditionDivRef;
    if (postcondition) {
      drawer = this.postconditionDrawer;
      editorRef = this.postconditionDivRef;
    }

    if (drawer.opened) {
      drawer.toggle();
      editorRef.nativeElement.style.width = "50px";
      this.refinement.onDragMoveEmitter.next();
    } else {
      editorRef.nativeElement.style.width = "";
      drawer.toggle();
      this.refinement.onDragMoveEmitter.next();
    }
  }

  private setVerifcationState(statement : Statement) {
    if (this.refinement.id == statement.id) {
      this.refinement.proven = statement.proven
      if (this.refinement.proven) {
        this.boxTitleRef.nativeElement.style.backgroundColor = "rgb(140,182,60)";
        this.refinementBoxRef.nativeElement.style.borderColor = "rgb(140,182,60)";
      } else {
        this.boxTitleRef.nativeElement.style.backgroundColor = "rgb(163,34,35)";
        this.refinementBoxRef.nativeElement.style.borderColor = "rgb(163,34,35)";
      }
    }
  }

  /**
   * Used to make the root statement not deleteable by the user
   * @returns true, if the statement is the root statement, else false
   */
  public isRoot() : boolean {
    return this.treeService.isRootNode(this.refinement)
  }

  /**
   * Emit the new posiition of the statement to the background #
   * and sync the position to the internal state for saving the state
   * @param $event The event, which triggered the function call
   */
  public onDragEnded($event : CdkDragEnd) {
    this.refinement.onDragEndEmitter.next($event)
    this.refinement.position = new Position($event.source.getFreeDragPosition().x, $event.source.getFreeDragPosition().y)
  }

  public get dragPosition() : Point {
    return this._dragPosition
  }
}
