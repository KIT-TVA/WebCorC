import { Component, Input } from "@angular/core";

import { StatementComponent } from "../statement/statement.component";
import { Refinement } from "../../../../types/refinement";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatGridListModule } from "@angular/material/grid-list";
import { RefinementWidgetComponent } from "../../../../widgets/refinement-widget/refinement-widget.component";

import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import {
  AbstractStatement,
  StatementType,
} from "../../../../types/statements/abstract-statement";
import { Position } from "../../../../types/position";
import { createEmptyStatementNode } from "../../../../types/statements/nodes/statement-node-utils";
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
  standalone: true,
})
export class RootStatementComponent extends Refinement {
  @Input({ required: true }) _node!: RootStatementNode;

  // Element used to spawn the child statements in

  public constructor(treeService: TreeService) {
    super(treeService);
  }

  public override getTitle(): string {
    return "Root";
  }

  /**
   * Add the child statements chosen by the user .
   * The new child statement then get created in component
   */
  public chooseRefinement($event: StatementType): void {
    const newNode = createEmptyStatementNode($event, this._node);
    (this._node as RootStatementNode).childStatementNode = newNode;
    newNode.overridePrecondition(this._node, this._node.precondition);
    this.treeService.addStatementNode(newNode);
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
