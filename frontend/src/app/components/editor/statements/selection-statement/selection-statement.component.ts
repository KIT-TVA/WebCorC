import { Component, Input } from "@angular/core";

import { StatementComponent } from "../statement/statement.component";
import { Refinement } from "../../../../types/refinement";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatGridListModule } from "@angular/material/grid-list";
import { RefinementWidgetComponent } from "../../../../widgets/refinement-widget/refinement-widget.component";
import { ConditionEditorComponent } from "../../condition/condition-editor/condition-editor.component";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialog } from "@angular/material/dialog";
import { ChooseRefinementComponent } from "../../../choose-refinement/choose-refinement.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AbstractStatement } from "../../../../types/statements/abstract-statement";
import { Position } from "../../../../types/position";
import { SelectionStatementNode } from "../../../../types/statements/nodes/selection-statement-node";
import { createEmptyStatementNode } from "../../../../types/statements/nodes/createStatementNode";
import { HandleComponent } from "ngx-vflow";
import { index } from "d3";

/**
 * Component in the graphical editor to represent the {@link SelectionStatement}
 * The Selectionstatement has n child statements and n guard statements.
 * The guard conditons and the precondition get propagated to the precondition
 * of the child.
 */
@Component({
  selector: "app-selection-statement",
  imports: [
    StatementComponent,
    MatGridListModule,
    RefinementWidgetComponent,
    ConditionEditorComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ConditionEditorComponent,
    HandleComponent
],
  templateUrl: "./selection-statement.component.html",
  styleUrl: "./selection-statement.component.scss",
})
export class SelectionStatementComponent extends Refinement {
  @Input({ required: true }) _node!: SelectionStatementNode;

  override export(): AbstractStatement | undefined {
    return undefined;
  }

  public constructor(
    treeService: TreeService,
    private dialog: MatDialog,
  ) {
    super(treeService);

    // ensure at least one element is in the array to ensure rendering without errors
  }

  public override getTitle(): string {
    return "Selection";
  }

  /**
   * Refresh the link state of this statement and all child statements
   */
  public override refreshLinkState(): void {
    super.refreshLinkState();
  }

  public addSelection() {
    this._node.addSelection();
  }

  public removeSelection() {
    const length = this._node.children.length;
    if (this._node.children[length - 1]) {
      this.treeService.deleteStatementNode(this._node.children[length - 1]!);
    }
    this._node.removeSelection();
  }

  public override resetPosition(position: Position, offset: Position): void {
    this.position.set(position);
    this.position.add(offset);
  }

  /**
   * Open {@link ChooseRefinementComponent} and add the child statement according to the
   * index of the guard to add the statement to.
   * @param index The position to add the statement
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public chooseRefinement(index: number): void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const newNode = createEmptyStatementNode(result, this._node);
      this._node.setSelection(index, newNode);
      this.treeService.addStatementNode(newNode);
    });

    setTimeout(() => this.refreshLinkState(), 5);
  }

  protected readonly index = index;
}
