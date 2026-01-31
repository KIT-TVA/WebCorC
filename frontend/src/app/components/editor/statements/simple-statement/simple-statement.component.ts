import {
  Component,
  Input,
  OnInit,
} from "@angular/core";

import { StatementComponent } from "../statement/statement.component";
import { Refinement } from "../../../../types/refinement";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatGridListModule } from "@angular/material/grid-list";
import { ConditionEditorComponent } from "../../condition/condition-editor/condition-editor.component";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { Position } from "../../../../types/position";
import { AbstractStatement } from "../../../../types/statements/abstract-statement";
import { SimpleStatementNode } from "../../../../types/statements/nodes/simple-statement-node";

/**
 * Component representing an instande of {@link SimpleStatement} in the grahical editor.
 */
@Component({
  selector: "app-simple-statement",
  imports: [
    StatementComponent,
    MatGridListModule,
    ConditionEditorComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ConditionEditorComponent,
  ],
  templateUrl: "./simple-statement.component.html",
  standalone: true,
  styleUrl: "./simple-statement.component.scss",
})
export class SimpleStatementComponent extends Refinement implements OnInit {
  @Input() _node!: SimpleStatementNode;

  override export(): AbstractStatement | undefined {
    throw new Error("Method not implemented.");
  }

  public constructor(treeService: TreeService) {
    super(treeService);
  }

  ngOnInit() {
  }

  public override getTitle(): string {
    return "Assignment";
  }

  public override resetPosition(position: Position, offset: Position): void {
    this.position.set(position);
    this.position.add(offset);
  }
}
