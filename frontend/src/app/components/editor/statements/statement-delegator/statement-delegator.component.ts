import { Component, Input } from "@angular/core";
import { CompositionStatementComponent } from "../composition-statement/composition-statement.component";
import { StrongWeakStatementComponent } from "../strong-weak-statement/strong-weak-statement.component";
import { RepetitionStatementComponent } from "../repetition-statement/repetition-statement.component";
import { SelectionStatementComponent } from "../selection-statement/selection-statement.component";
import { SimpleStatementComponent } from "../simple-statement/simple-statement.component";

import { AbstractStatementNode } from "../../../../types/statements/nodes/abstract-statement-node";
import { CompositionStatementNode } from "../../../../types/statements/nodes/composition-statement-node";
import { SelectionStatementNode } from "../../../../types/statements/nodes/selection-statement-node";
import { SimpleStatementNode } from "../../../../types/statements/nodes/simple-statement-node";
import { SkipStatementNode } from "../../../../types/statements/nodes/skip-statement-node";
import { RepetitionStatementNode } from "../../../../types/statements/nodes/repetition-statement-node";
import { RootStatementComponent } from "../root-statement/root-statement.component";
import { RootStatementNode } from "../../../../types/statements/nodes/root-statement-node";

@Component({
  selector: "app-statement-delegator",
  imports: [
    CompositionStatementComponent,
    StrongWeakStatementComponent,
    RepetitionStatementComponent,
    SelectionStatementComponent,
    SimpleStatementComponent,
    RootStatementComponent
],
  templateUrl: "./statement-delegator.component.html",
  standalone: true,
  styleUrl: "./statement-delegator.component.css",
})
export class StatementDelegatorComponent {
  @Input() statement!: AbstractStatementNode;

  asCompositionStatementNode(node: AbstractStatementNode) {
    return node as CompositionStatementNode;
  }

  asSelectionStatementNode(node: AbstractStatementNode) {
    return node as SelectionStatementNode;
  }

  asSimpleStatementNode(node: AbstractStatementNode) {
    return node as SimpleStatementNode;
  }

  asSkipStatementNode(node: AbstractStatementNode) {
    return node as SkipStatementNode;
  }

  asRepetitionStatementNode(node: AbstractStatementNode) {
    return node as RepetitionStatementNode;
  }

  asRootStatementNode(node: AbstractStatementNode) {
    return node as RootStatementNode;
  }
}
