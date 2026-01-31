import {
  Component,
  Input,
  OnDestroy,
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
import { ICondition } from "../../../../types/condition/condition";
import { Subscription } from "rxjs";

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
export class SimpleStatementComponent extends Refinement implements OnInit, OnDestroy {
  @Input()
  set _node(value: SimpleStatementNode) {
    this._nodeValue = value;
    this.setupSignalsAndSubscriptions(value);
  }
  get _node(): SimpleStatementNode {
    return this._nodeValue;
  }
  private _nodeValue!: SimpleStatementNode;

  programStatementSignal: WritableSignal<ICondition> = signal({ condition: '' });
  private subscriptions = new Subscription();

  override export(): AbstractStatement | undefined {
    throw new Error("Method not implemented.");
  }

  public constructor(treeService: TreeService) {
    super(treeService);
  }

  ngOnInit() {
    // Initialization is now handled by the _node setter
  }

  private setupSignalsAndSubscriptions(node: SimpleStatementNode) {
    this.programStatementSignal.set(node.programStatement.getValue());

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();

    this.subscriptions.add(node.programStatement.subscribe(value => {
      if (this.programStatementSignal() !== value) {
        this.programStatementSignal.set(value);
      }
    }));
  }

  onProgramStatementChange(newCondition: ICondition) {
    this.programStatementSignal.set(newCondition);
    this._nodeValue.programStatement.next(newCondition);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public override getTitle(): string {
    return "Assignment";
  }

  public override resetPosition(position: Position, offset: Position): void {
    this.position.set(position);
    this.position.add(offset);
  }
}
