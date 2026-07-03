import { Component, Input, OnInit, inject } from "@angular/core";

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
import { AiChatService } from "../../../../services/ai-chat/ai-chat.service";

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
  styleUrl: "./simple-statement.component.css",
})
export class SimpleStatementComponent extends Refinement implements OnInit {
  @Input() _node!: SimpleStatementNode;

  override export(): AbstractStatement | undefined {
    throw new Error("Method not implemented.");
  }

  public constructor(treeService: TreeService, private aiChatService: AiChatService) {
    super(treeService);
  }

  ngOnInit() {}

  public onEditableContentChanged(): void {
    this.treeService.markSubtreeUnverified(this._node);
  }

  public synthesizeWithAi(): void {
    const pre = this._node.precondition.getValue().condition;
    const post = this._node.postcondition.getValue().condition;
    const variables = this.treeService.rootFormula?.javaVariables ?? [];
    const isLoopUpdate = this._node.statement.type === "REPETITION";
    const synthesisTarget = this._node.programStatement;

    this.aiChatService.setSynthesisTarget(synthesisTarget);
    this.aiChatService.setSynthesisStatementName(this._node.statement.name);
    this.aiChatService.addSynthesisPrompt(variables, pre, post, isLoopUpdate);
  }

  public override getTitle(): string {
    return "Assignment";
  }

  public override resetPosition(position: Position, offset: Position): void {
    this.position.set(position);
    this.position.add(offset);
  }
}
