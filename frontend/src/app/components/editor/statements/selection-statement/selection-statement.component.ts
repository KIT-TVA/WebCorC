import { Component, Input, OnDestroy, OnInit, signal, WritableSignal } from "@angular/core";

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
import { ICondition } from "../../../../types/condition/condition";
import { Subscription } from "rxjs";

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
export class SelectionStatementComponent extends Refinement implements OnInit, OnDestroy {
  @Input()
  set _node(value: SelectionStatementNode) {
    this._nodeValue = value;
    this.setupSignalsAndSubscriptions(value);
  }
  get _node(): SelectionStatementNode {
    return this._nodeValue;
  }
  private _nodeValue!: SelectionStatementNode;

  guardSignals: WritableSignal<ICondition>[] = [];
  private subscriptions = new Subscription();

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
    // Initialization is now handled by the _node setter
  }

  private setupSignalsAndSubscriptions(node: SelectionStatementNode) {
    this.guardSignals = node.guards.map(guard => signal(guard.getValue()));

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();

    node.guards.forEach((guard, i) => {
      this.subscriptions.add(guard.subscribe(value => {
        if (this.guardSignals[i] && this.guardSignals[i]() !== value) {
          this.guardSignals[i].set(value);
        }
      }));
    });
  }

  onGuardChange(newCondition: ICondition, index: number) {
    this.guardSignals[index].set(newCondition);
    this._nodeValue.guards[index].next(newCondition);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public override getTitle(): string {
    return "Selection";
  }

  public addSelection() {
    this._node.addSelection();
    this.setupSignalsAndSubscriptions(this._node); // Re-setup to include the new guard
  }

  public removeSelection() {
    const length = this._node.children.length;
    if (this._node.children[length - 1]) {
      this.treeService.deleteStatementNode(this._node.children[length - 1]!);
    }
    this._node.removeSelection();
    this.setupSignalsAndSubscriptions(this._node); // Re-setup to remove the old guard
  }

  public override resetPosition(position: Position, offset: Position): void {
    this.position.set(position);
    this.position.add(offset);
  }

  public chooseRefinement(index: number, type: StatementType): void {
    this.treeService.createNodeForStatement(this._node, type, index);
  }
}
