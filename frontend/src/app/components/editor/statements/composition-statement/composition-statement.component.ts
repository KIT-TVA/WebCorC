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
import { MatIconModule } from "@angular/material/icon";
import {
  AbstractStatement,
  StatementType,
} from "../../../../types/statements/abstract-statement";
import { Position } from "../../../../types/position";
import { CompositionStatementNode } from "../../../../types/statements/nodes/composition-statement-node";
import { createEmptyStatementNode } from "../../../../types/statements/nodes/createStatementNode";
import { HandleComponent } from "ngx-vflow";

/**
 * Composition statement in {@link EditorComponent}.
 * The compositon statement propagates the precondition to the left statement and the postcondition to the right statement.
 * The intermediate condition is the post condition of the left statement and the precondition of the right statement.
 * The Composition Statement gets saved as {@link CompositionStatement}
 */
@Component({
  selector: "app-composition-statement",
  imports: [
    StatementComponent,
    MatGridListModule,
    RefinementWidgetComponent,
    ConditionEditorComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    HandleComponent,
  ],
  templateUrl: "./composition-statement.component.html",
  styleUrl: "./composition-statement.component.scss",
  standalone: true,
})
export class CompositionStatementComponent extends Refinement {
  @Input({ required: true }) _node!: CompositionStatementNode;

  // Element used to spawn the child statements in

  public constructor(
    treeService: TreeService,
  ) {
    super(treeService);
  }

  public override getTitle(): string {
    return "Composition";
  }

  /**
   * Add the child statements chosen by the user.
   * The new child statement then get created in component
   * @param side hardcoded string from the template to identify which button got used
   * @param type type of statement to add
   */
  public chooseRefinement(side: "left" | "right", type: StatementType): void {
    const newNode = createEmptyStatementNode(type, this._node);
    if (side === "left") {
      this._node.firstStatementNode = newNode;
      newNode.overridePrecondition(this._node, this._node.precondition);
    } else {
      this._node.secondStatementNode = newNode;
      newNode.overridePrecondition(this._node, this._node.intermediateCondition);
    }
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
