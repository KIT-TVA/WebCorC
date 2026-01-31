import { Component, Input, OnInit } from "@angular/core";

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
import { MatButtonModule } from "@angular/material/button";
import {
  AbstractStatement,
  StatementType,
} from "../../../../types/statements/abstract-statement";
import { Position } from "../../../../types/position";
import { SelectionStatementNode } from "../../../../types/statements/nodes/selection-statement-node";
import { HandleComponent } from "ngx-vflow";

/**
 * Component in the graphical editor to represent the {@link SelectionStatement}
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
    HandleComponent,
  ],
  templateUrl: "./selection-statement.component.html",
  styleUrl: "./selection-statement.component.scss",
  standalone: true,
})
export class SelectionStatementComponent extends Refinement implements OnInit {
  @Input() _node!: SelectionStatementNode;

  override export(): AbstractStatement | undefined {
    return undefined;
  }

  public constructor(
    treeService: TreeService,
    private dialog: MatDialog,
  ) {
    super(treeService);
  }

  ngOnInit(): void {
  }

  public override getTitle(): string {
    return "Selection";
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

  public chooseRefinement(index: number, type: StatementType): void {
    this.treeService.createNodeForStatement(this._node, type, index);
  }
}
