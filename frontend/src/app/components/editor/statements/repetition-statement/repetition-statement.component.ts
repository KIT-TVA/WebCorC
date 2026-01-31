import {
  Component,
  Input,
  OnInit,
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
import { StatementType } from "../../../../types/statements/abstract-statement";

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
export class RepetitionStatementComponent extends Refinement implements OnInit {
  @Input() _node!: RepetitionStatementNode;

  public constructor(treeService: TreeService) {
    super(treeService);
  }

  ngOnInit(): void {
  }

  public override getTitle(): string {
    return "Repetition";
  }

  public chooseRefinement(type: StatementType) {
    this.treeService.createNodeForStatement(this._node, type);
  }

  public override resetPosition(position: Position, offset: Position): void {
    if (offset.xinPx < 0) {
      offset.xinPx = offset.xinPx * 3.5;
    }

    this.position.set(position);
    this.position.add(offset);
  }

  public override export() {
    return undefined;
  }
}
