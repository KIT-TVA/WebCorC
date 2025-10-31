import {
  Component,
  effect,
  Input,
  OnInit,
  signal,
  WritableSignal,
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
import { Condition, ICondition } from "../../../../types/condition/condition";

/**
 * Component representing an instande of {@link SimpleStatement} in the grahical editor.
 * The Root statement is also a simple statement, with one child element
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
  @Input({ required: true }) _node!: SimpleStatementNode;

  override export(): AbstractStatement | undefined {
    throw new Error("Method not implemented.");
  }

  private _statement: Refinement | undefined;

  protected pseudoCondition: WritableSignal<ICondition> = signal(
    new Condition(""),
  );

  public constructor(treeService: TreeService) {
    super(treeService);
    effect(() => {
      this._node.statement.programStatement =
        this.pseudoCondition().programStatement;
    });
  }

  public ngOnInit() {
    //Commented out the next line that causes the bug mentioned in issue #44
    //Not sure if important thus the comment
    this.pseudoCondition.set(
      new Condition(this._node.statement.programStatement),
    );
  }

  public override getTitle(): string {
    return "Statement";
  }

  public override refreshLinkState(): void {
    super.refreshLinkState();

    if (this._statement) {
      this._statement.refreshLinkState();
    }
  }

  public override resetPosition(position: Position, offset: Position): void {
    this.position.set(position);
    this.position.add(offset);

    if (this._statement) {
      this._statement.resetPosition(this.position, new Position(100, -10));
    }
  }

  public get statement(): Refinement | undefined {
    return this._statement;
  }

  public set statement(statement: Refinement | undefined) {
    this._statement = statement;
  }

  protected readonly Condition = Condition;
}
