import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StatementComponent } from "../statement/statement.component";
import { Refinement } from "../../../../types/refinement";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatGridListModule } from "@angular/material/grid-list";
import { RefinementWidgetComponent } from "../../../../widgets/refinement-widget/refinement-widget.component";

import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialog } from "@angular/material/dialog";
import { ChooseRefinementComponent } from "../../../choose-refinement/choose-refinement.component";
import { MatIconModule } from "@angular/material/icon";
import { AbstractStatement } from "../../../../types/statements/abstract-statement";
import { Position } from "../../../../types/position";
import { createEmptyStatementNode } from "../../../../types/statements/nodes/createStatementNode";
import { RootStatementNode } from "../../../../types/statements/nodes/root-statement-node";

/**
 * Composition statement in {@link EditorComponent}.
 * The compositon statement propagates the precondition to the left statement and the postcondition to the right statement.
 * The intermediate condition is the post condition of the left statement and the precondition of the right statement.
 * The Composition Statement gets saved as {@link CompositionStatement}
 */
@Component({
  selector: "app-root-statement",
  imports: [
    CommonModule,
    StatementComponent,
    MatGridListModule,
    RefinementWidgetComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: "./root-statement.component.html",
  styleUrl: "./root-statement.component.scss",
})
export class RootStatementComponent extends Refinement {
  @Input({ required: true }) _node!: RootStatementNode;

  // Element used to spawn the child statements in

  public constructor(
    treeService: TreeService,
    private dialog: MatDialog,
  ) {
    super(treeService);
  }

  public override getTitle(): string {
    return "Root";
  }

  /**
   * Add the child statements chosen by the user in {@link ChooseRefinementComponent} .
   * The new child statement then get created in component
   * @param side hardcoded string from the template to identify which button got used
   */
  public chooseRefinement(): void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const newNode = createEmptyStatementNode(result, this._node);
      (this._node as RootStatementNode).childStatementNode = newNode;
      this.treeService.addStatementNode(newNode);
    });
  }

  public override resetPosition(position: Position, offset: Position): void {
    this.position.set(position);
    this.position.add(offset);

    //TODO do for all substatements
  }

  /**
   * Converts this component to the data only CompositionStatment {@link CompositionStatement}
   * @returns a new Instance of CompositionStatment
   */
  public override export(): AbstractStatement | undefined {
    //TODO
    return undefined;
  }
}
