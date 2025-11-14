import {
  Component,
  Input,
  signal,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";

import { StatementComponent } from "../statement/statement.component";
import { Refinement } from "../../../../types/refinement";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatGridListModule } from "@angular/material/grid-list";
import { RefinementWidgetComponent } from "../../../../widgets/refinement-widget/refinement-widget.component";
import { ConditionEditorComponent } from "../../condition/condition-editor/condition-editor.component";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { Position } from "../../../../types/position";
import { RepetitionStatementNode } from "../../../../types/statements/nodes/repetition-statement-node";
import { createEmptyStatementNode } from "../../../../types/statements/nodes/statement-node-utils";
import { StatementType } from "../../../../types/statements/abstract-statement";
import { Condition } from "../../../../types/condition/condition";

/**
 * Compoent in the Graphical Editor to represent an instance of {@link RepetitionStatement}
 */
@Component({
  selector: "app-repetition-statement",
  imports: [
    StatementComponent,
    MatGridListModule,
    RefinementWidgetComponent,
    ConditionEditorComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: "./repetition-statement.component.html",
  standalone: true,
  styleUrl: "./repetition-statement.component.scss",
})
export class RepetitionStatementComponent extends Refinement {
  @Input({ required: true }) _node!: RepetitionStatementNode;

  @ViewChild("subComponentSpawn", { read: ViewContainerRef })
  private componentSpawn!: ViewContainerRef;

  public constructor(treeService: TreeService) {
    super(treeService);
  }

  public override getTitle(): string {
    return "Repetition";
  }

  /**
   * Add the child statement to the dom
   */
  public chooseRefinement(type: StatementType) {
    if (!type) {
      return;
    }
    const newNode = createEmptyStatementNode(type, this._node);
    this._node.loopStatementNode = newNode;
    newNode.overridePrecondition(
      this._node,
      signal(
        new Condition(
          this._node.precondition().condition +
            " & " +
            this._node.invariant().condition,
        ),
      ),
    );
    this.treeService.addStatementNode(newNode);
  }

  public override resetPosition(position: Position, offset: Position): void {
    if (offset.xinPx < 0) {
      offset.xinPx = offset.xinPx * 3.5;
    }

    this.position.set(position);
    this.position.add(offset);
  }

  /**
   * Save the state of this component to the corresponding data only class
   * @see RepetitionStatement
   * @returns New Instance of data only Repetition Statement class
   */
  public override export() {
    return undefined;
  }
}
