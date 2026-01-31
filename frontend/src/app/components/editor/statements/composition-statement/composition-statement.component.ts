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
import { HandleComponent } from "ngx-vflow";
import { ICondition } from "../../../../types/condition/condition";
import { Subscription } from "rxjs";

/**
 * Composition statement in {@link EditorComponent}.
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
export class CompositionStatementComponent
  extends Refinement
  implements OnInit, OnDestroy
{
  @Input() public icon = "pi pi-circle";
  @Input()
  set _node(value: CompositionStatementNode) {
    this._nodeValue = value;
    this.setupSignalsAndSubscriptions(value);
  }
  get _node(): CompositionStatementNode {
    return this._nodeValue;
  }
  private _nodeValue!: CompositionStatementNode;

  intermediateConditionSignal: WritableSignal<ICondition> = signal({
    condition: "",
  });
  private subscriptions = new Subscription();

  public constructor(treeService: TreeService) {
    super(treeService);
  }

  ngOnInit(): void {
    // Initialization is now handled by the _node setter
  }

  private setupSignalsAndSubscriptions(node: CompositionStatementNode) {
    this.intermediateConditionSignal.set(node.intermediateCondition.getValue());

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();

    this.subscriptions.add(
      node.intermediateCondition.subscribe((value) => {
        if (this.intermediateConditionSignal() !== value) {
          this.intermediateConditionSignal.set(value);
        }
      }),
    );
  }

  onIntermediateChange(newCondition: ICondition) {
    this.intermediateConditionSignal.set(newCondition);
    this._nodeValue.intermediateCondition.next(newCondition);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public override getTitle(): string {
    return "Sequence";
  }

  public chooseRefinement(side: "left" | "right", type: StatementType): void {
    this.treeService.createNodeForStatement(
      this._node,
      type,
      side === "left" ? 0 : 1,
    );
  }

  public override resetPosition(position: Position, offset: Position): void {
    this.position.set(position);
    this.position.add(offset);
  }

  public override export(): AbstractStatement | undefined {
    return undefined;
  }
}
