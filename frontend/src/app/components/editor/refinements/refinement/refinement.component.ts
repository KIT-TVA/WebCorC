import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatGridListModule} from "@angular/material/grid-list";
import {Refinement} from "../../../../types/refinement";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {GridTileHeaderDirective} from "../../../../directives/grid-tile-header.directive";
import {GridTileBorderDirective} from "../../../../directives/grid-tile-border.directive";
import {CdkDrag, CdkDragEnd, CdkDragHandle, CdkDragMove, Point} from "@angular/cdk/drag-drop";

import {TreeService} from "../../../../services/tree/tree.service";
import {MatIconModule} from "@angular/material/icon";
import {MatDrawer, MatSidenavModule} from "@angular/material/sidenav";
import {MatButtonModule} from "@angular/material/button";
import {QbCException, VerificationResult} from "../../../../types/net/verification-net-types";
import {MatExpansionModule} from "@angular/material/expansion";
import {VerificationErrorListComponent} from "../../../verification-error-list.component";
import {MatListModule} from "@angular/material/list";
import {MatDialog} from "@angular/material/dialog";
import {VerificationResultComponent} from "../../../../dialogs/verification-result.component";
import { Statement } from '../../../../types/statements/statement';
import { Position } from '../../../../types/position';

/**
 * Component to present refinements.
 * This component is only to show the refinement given.
 * This is not the (super) type Refinement.
 */
@Component({
  selector: 'refinement-base',
  standalone: true,
  imports: [CommonModule, MatGridListModule, MatFormFieldModule, MatInputModule, FormsModule, ConditionEditorComponent, GridTileHeaderDirective, GridTileBorderDirective, CdkDrag, CdkDragHandle, MatIconModule, MatSidenavModule, MatButtonModule, MatExpansionModule, VerificationErrorListComponent, MatListModule],
  templateUrl: './refinement.component.html',
  styleUrl: './refinement.component.scss'
})
export class RefinementComponent implements AfterViewInit {
  private static readonly EDITOR_CONTAINER_EXPANSION_TRIGGER = 150;
  private static readonly EDITOR_CONTAINER_EXPANSION = 200;

  @Input() refinement!: Refinement;

  @ViewChild("preconditionDrawer") preconditionDrawer!: MatDrawer;
  @ViewChild("postconditionDrawer") postconditionDrawer!: MatDrawer;
  @ViewChild("preconditionDiv") preconditionDivRef!: ElementRef;
  @ViewChild("postconditionDiv") postconditionDivRef!: ElementRef;
  @ViewChild("refinementBox") refinementBoxRef!: ElementRef;
  @ViewChild("boxTitle") boxTitleRef!: ElementRef;

  verificationResult: VerificationResult | undefined;

  dragPosition : Point = {x:0, y: 50}

  constructor(private treeService: TreeService, private dialog: MatDialog) {
  }

  ngAfterViewInit(): void {

    this.dragPosition = {x : this.refinement.position.xinPx, y: this.refinement.position.yinPx}

    if (this.refinement.isPreconditionEditable()) {
      this.toggleConditionEditorView(false);
    }
    if (this.refinement.isPostConditionEditable()) {
      this.toggleConditionEditorView(true);
    }

    this.treeService.verificationResultNotifier.subscribe(
      verificationResult => this.onVerified(verificationResult));
  }

  deleteRefinement(): void {
    this.refinement.removeVariableUsages();
    if (this.treeService.rootNode === this.refinement) {
      this.treeService.removeMacros();
    }
    this.treeService.deletionNotifier.next(this.refinement);
  }

  onDragMoved(move: CdkDragMove): void {
    this.refinement.onDragMoveEmitter.next();
    this.expandEditorContainer(move);
  }

  /**
   * Expands the editor container, when a refinement box is dragged to the editor containers right or bottom border.
   * @param move event fired through a users drag.
   */
  expandEditorContainer(move: CdkDragMove): void {
    const boxPosition = move.source.element.nativeElement.getBoundingClientRect();
    const editorContainer = document.getElementById("editorContainer");
    const widthController = document.getElementById("editorWidthController");
    const heightController = document.getElementById("editorHeightController");
    if (editorContainer && widthController && heightController) {
      if (boxPosition.x + boxPosition.width + editorContainer.scrollLeft >=
          editorContainer.scrollWidth - RefinementComponent.EDITOR_CONTAINER_EXPANSION_TRIGGER) {
        widthController.style.width = editorContainer.scrollWidth+RefinementComponent.EDITOR_CONTAINER_EXPANSION + "px";
      }
      if (boxPosition.y + boxPosition.height + editorContainer.scrollTop >=
          editorContainer.scrollHeight - RefinementComponent.EDITOR_CONTAINER_EXPANSION_TRIGGER) {
        heightController.style.height = editorContainer.scrollHeight + RefinementComponent.EDITOR_CONTAINER_EXPANSION + "px";
      }
    }
  }

  onConditionEdited(editedPrecondition: boolean): void {
  }

  toggleConditionEditorView(postcondition: boolean): void {
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

  onVerified(verificationResult: VerificationResult): void {
    if (!verificationResult.errors) {
      return;
    }

    this.verificationResult = {
      errors: verificationResult.errors.filter(err => err.refinementID === this.refinement.id),
      correctnessCondition: verificationResult.correctnessCondition,
      prover: verificationResult.prover
    };
    if (this.verificationResult.errors.length === 0) {
      if (this.verificationResult.correctnessCondition && this.verificationResult.correctnessCondition !== "true") {
        // Current under a certain condition
        this.boxTitleRef.nativeElement.style.backgroundColor = "rgba(255,184,23,0.97)";
        this.refinementBoxRef.nativeElement.style.borderColor = "rgba(255,184,23,0.97)";
      } else if (this.verificationResult.prover[this.refinement.id]) {
        // Verified by a prover
        this.boxTitleRef.nativeElement.style.backgroundColor = "rgb(46,171,63)";
        this.refinementBoxRef.nativeElement.style.borderColor = "rgb(46,171,63)";
      }
    } else {
      // Parsing or verification failed
      this.boxTitleRef.nativeElement.style.backgroundColor = "rgb(201,73,73)";
      this.refinementBoxRef.nativeElement.style.borderColor = "rgb(201,73,73)";
    }
  }

  openVerificationResultDialog(): void {
    this.dialog.open(VerificationResultComponent, {data: {result: this.verificationResult, refinementId: this.refinement.id}});
  }

  isRoot() : boolean {
    return this.treeService.isRootNode(this.refinement)
  }

  onDragEnded($event : CdkDragEnd) {
    this.refinement.onDragEndEmitter.next($event)
    this.refinement.position = new Position($event.source.getFreeDragPosition().x, $event.source.getFreeDragPosition().y)
  }

  export() : Statement | undefined {
    return 
  } 
}
