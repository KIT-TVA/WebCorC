import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal
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
import { ICondition } from "../../../../types/condition/condition";
import { Subscription } from "rxjs";

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
export class RepetitionStatementComponent extends Refinement implements OnInit, OnDestroy {
  @Input()
  set _node(value: RepetitionStatementNode) {
    this._nodeValue = value;
    this.setupSignalsAndSubscriptions(value);
  }
  get _node(): RepetitionStatementNode {
    return this._nodeValue;
  }
  private _nodeValue!: RepetitionStatementNode;

  guardSignal: WritableSignal<ICondition> = signal({ condition: '' });
  invariantSignal: WritableSignal<ICondition> = signal({ condition: '' });
  variantSignal: WritableSignal<ICondition> = signal({ condition: '' });

  private subscriptions = new Subscription();

  public constructor(treeService: TreeService) {
    super(treeService);
  }

  ngOnInit(): void {
    // Initialization is now handled by the _node setter
  }

  private setupSignalsAndSubscriptions(node: RepetitionStatementNode) {
    // This block handles data flow from the model (BehaviorSubject) to the UI (Signal)
    this.guardSignal.set(node.guard.getValue());
    this.invariantSignal.set(node.invariant.getValue());
    this.variantSignal.set(node.variant.getValue());

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();

    this.subscriptions.add(node.guard.subscribe(value => {
      if (this.guardSignal() !== value) { this.guardSignal.set(value); }
    }));
    this.subscriptions.add(node.invariant.subscribe(value => {
      if (this.invariantSignal() !== value) { this.invariantSignal.set(value); }
    }));
    this.subscriptions.add(node.variant.subscribe(value => {
      if (this.variantSignal() !== value) { this.variantSignal.set(value); }
    }));
  }

  // These methods handle data flow from the UI (conditionChange event) to the model (BehaviorSubject)
  onGuardChange(newCondition: ICondition) {
    this.guardSignal.set(newCondition);
    this._nodeValue.guard.next(newCondition);
  }

  onInvariantChange(newCondition: ICondition) {
    this.invariantSignal.set(newCondition);
    this._nodeValue.invariant.next(newCondition);
  }

  onVariantChange(newCondition: ICondition) {
    this.variantSignal.set(newCondition);
    this._nodeValue.variant.next(newCondition);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
