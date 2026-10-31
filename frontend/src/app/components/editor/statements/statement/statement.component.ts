import {
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  signal,
  TemplateRef,
  ViewChild,
  inject,
} from "@angular/core";

import { MatGridListModule } from "@angular/material/grid-list";
import { Refinement } from "../../../../types/refinement";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { ConditionEditorComponent } from "../../condition/condition-editor/condition-editor.component";
import { TreeService } from "../../../../services/tree/tree.service";
import { MatIconModule } from "@angular/material/icon";
import { MatDrawer, MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatListModule } from "@angular/material/list";
import { AbstractStatementNode } from "../../../../types/statements/nodes/abstract-statement-node";
import { HandleComponent } from "ngx-vflow";
import { GridTileBorderDirective } from "../../../../directives/grid-tile-border.directive";
import { Card } from "primeng/card";
import {
  Button,
  ButtonDirective,
  ButtonIcon,
  ButtonLabel,
} from "primeng/button";
import { Toolbar } from "primeng/toolbar";
import { Dialog } from "primeng/dialog";
import { GlobalSettingsService } from "../../../../services/global-settings.service";
import { NetworkJobService } from "../../../../services/tree/network/network-job.service";
import { ProjectService } from "../../../../services/project/project.service";
import { AsyncPipe, NgTemplateOutlet } from "@angular/common";
import { AiChatService } from "../../../../services/ai-chat/ai-chat.service";
import { SimpleStatementNode } from "../../../../types/statements/nodes/simple-statement-node";
import {VerifierService} from "../../../../services/verifier/verifier.service";
import {FUNCTIONAL_VERIFIER_ID, Verifier} from "../../../../types/Verifier";
import {Accordion, AccordionContent, AccordionHeader, AccordionPanel} from "primeng/accordion";
import { MatTooltip } from "@angular/material/tooltip";
import { BehaviorSubject } from "rxjs";
import { ICondition } from "../../../../types/condition/condition";
import { verifierResultClass } from "../../../../types/statements/abstract-statement";

/**
 * Component to present the statements.
 * This component is only to show the statement given.
 * It is used as the template for the statements.
 * This is not the (super) type Refinement.
 */
@Component({
  selector: "app-statement-base",
  imports: [
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ConditionEditorComponent,
    MatIconModule,
    MatSidenavModule,
    MatButtonModule,
    MatExpansionModule,
    MatListModule,
    HandleComponent,
    GridTileBorderDirective,
    Card,
    Button,
    Toolbar,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    AsyncPipe,
    Dialog,
    NgTemplateOutlet,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    MatTooltip,
  ],
  templateUrl: "./statement.component.html",
  styleUrl: "./statement.component.css",
  standalone: true,
})
export class StatementComponent {
  private verifierService = inject(VerifierService);
  private treeService = inject(TreeService);
  private aiChatService = inject(AiChatService);
  globalSettingsService = inject(GlobalSettingsService);
  private networkTreeService = inject(NetworkJobService);
  private projectService = inject(ProjectService);

  private static readonly EDITOR_CONTAINER_EXPANSION_TRIGGER = 150;
  private static readonly EDITOR_CONTAINER_EXPANSION = 200;

  @Input() public refinement!: Refinement;
  @Input() public hideSourceHandle = false;
  @Input() public hideTargetHandle = false;
  @Input({ required: true }) _node!: AbstractStatementNode;
  @Input() public icon = "pi pi-circle";
  @Input() public showEditButton = true;
  @Input() public hasPopupMiddle = true;
  /**
   * When true, the popup middle column is rendered in every verifier panel (with
   * the panel's verifier passed to the template), not only the primary one. Used
   * by compositions, whose intermediate condition exists per verifier.
   */
  @Input() public hasVerifierMiddle = false;
  /** Label of the popup middle column's collapse/expand buttons. */
  @Input() public middleLabel = "Statement";

  @Output() delete = new EventEmitter();

  @ContentChild("middleContent") middleTemplate?: TemplateRef<{
    popup: boolean;
    statement: StatementComponent;
    verifier?: Verifier;
  }>;

  public dialogVisible = false;
  public readonly functionalVerifierId = FUNCTIONAL_VERIFIER_ID;
  /** Panels open in the popup accordion; the Functional Verifier starts open. */
  public openPanels: string[] = [FUNCTIONAL_VERIFIER_ID];
  private popupColumnStates = new Map<
    string,
    { pre: boolean; mid: boolean; post: boolean }
  >();

  @ViewChild("preconditionDrawer") private preconditionDrawer!: MatDrawer;
  @ViewChild("postconditionDrawer") private postconditionDrawer!: MatDrawer;
  @ViewChild("preconditionDiv") private preconditionDivRef!: ElementRef;
  @ViewChild("postconditionDiv") private postconditionDivRef!: ElementRef;

  public isVerifying = signal(false);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  public deleteRefinement(): void {
    this.treeService.deleteStatementNode(this._node);
    this.delete.emit();
  }

  public onEditableContentChanged(): void {
    this.treeService.markSubtreeUnverified(this._node);
  }

  public toggleConditionEditorView(postcondition: boolean): void {
    let drawer = this.preconditionDrawer;
    let editorRef = this.preconditionDivRef;
    if (postcondition) {
      drawer = this.postconditionDrawer;
      editorRef = this.postconditionDivRef;
    }

    if (drawer.opened) {
      drawer.toggle();
      editorRef.nativeElement.style.width = "50px";
    } else {
      editorRef.nativeElement.style.width = "";
      drawer.toggle();
    }
  }

  public getStatementSeverity(
    node: AbstractStatementNode,
  ): "success" | "secondary" | "warn" | "danger" {
    switch (node.statement.nodeState) {
      case "verified-all":
        return "success";
      case "verified-functional":
        return "success";
      case "settings-changed":
        return "warn";
      case "failed":
        return "danger";
      case "failed-non-functional":
        return "danger";
      case "unverified":
        return "secondary";
    }
  }

  public getStatementLabel(node: AbstractStatementNode): string {
    return node.statement.nodeState.replace(/-/g, " ");
  }

  public getStatementIcon(severity: string): string {
    if (this.isVerifying()) return 'pi pi-spin pi-spinner';

    switch (severity) {
      case "warn":
        return "pi pi-exclamation-triangle";
      case "danger":
        return "pi pi-times-circle";
      default:
        return "pi pi-check-circle";
    }
  }

  public verifyStatement(): void {
    if (this.isVerifying()) {
      return;
    }
    this.isVerifying.set(true);
    this.globalSettingsService.isVerifying = true;
    this.treeService.beginRun();

    // Finalize statements first
    this.treeService.finalizeStatements();

    // Create temporary formula from this node
    const tempFormula = this.treeService.createTempFormulaFromNode(this._node);

    // Verify the statement
    this.networkTreeService.verifyStatement(
      tempFormula,
      this._node,
      this.projectService.projectId,
      this.treeService.urn,
      this.verifierService.functionalOnly(),
      () => {
        this.isVerifying.set(false);
      },
    );
  }

  public synthesizeWithAi(): void {
    const pre = this._node.precondition.getValue().condition;
    const post = this._node.postcondition.getValue().condition;
    const variables = this.treeService.rootFormula?.javaVariables ?? [];
    const isLoopUpdate = this._node.statement.type === "REPETITION";
    const synthesisTarget =
      this._node.statement.type === "STATEMENT"
        ? (this._node as SimpleStatementNode).programStatement
        : undefined;
    this.aiChatService.setSynthesisTarget(synthesisTarget);
    this.aiChatService.setSynthesisStatementName(this._node.statement.name);
    this.aiChatService.addSynthesisPrompt(variables, pre, post, isLoopUpdate);
  }

  compactButton = {
    root: {
      sm: {
        paddingX: "0.2rem",
      },
      paddingX: "0px",
    },
    button: {
      paddingX: "0px",
      root: {
        sm: {
          paddingX: "0px",
        },
      },
    },
  };

  /**
   * Whether the verifier's popup panel has an expandable body (pre/statement/post
   * columns): true for the Functional Verifier and any verifier with variables. A
   * status-only verifier renders as a static header, matching the settings-less
   * pattern in verifier-manager.
   */
  public hasBody(verifier: Verifier): boolean {
    return (
        verifier.id === FUNCTIONAL_VERIFIER_ID || verifier.variables.length > 0
    );
  }

  /**
   * The verifiers shown as popup accordion panels: enabled ones that either have
   * expandable content (Functional Verifier or a verifier with variables) or that
   * have a status text to surface in the header — the Catalog's placeholder, or,
   * once reported, this statement's own per-Verifier result (see
   * {@link verifierStatusText}). Status-only verifiers render as a static header
   * (no chevron, no body).
   */
  public get items(): Verifier[] {
    return this.verifierService
      .verifiers()
      .filter(
        (verifier) =>
          verifier.enabled &&
          (this.hasBody(verifier) ||
            this.verifierStatusText(verifier) !== undefined),
      );
  }

  /**
   * Collapse state of the pre/statement/post columns inside one verifier's panel,
   * independent per verifier. Lazily initialized to all-open.
   */
  public popupColumns(verifierId: string): {
    pre: boolean;
    mid: boolean;
    post: boolean;
  } {
    let state = this.popupColumnStates.get(verifierId);
    if (!state) {
      state = { pre: true, mid: true, post: true };
      this.popupColumnStates.set(verifierId, state);
    }
    return state;
  }

  public togglePopupColumn(
    verifierId: string,
    column: "pre" | "mid" | "post",
  ): void {
    const state = this.popupColumns(verifierId);
    state[column] = !state[column];
  }

  /**
   * The status text shown in a verifier's popup panel header: that verifier's own
   * per-statement result once verification has reported one, falling back to the
   * Catalog's static placeholder otherwise. Reuses the panel header's existing
   * status-text slot (see the template's `verifier-status` span) rather than
   * adding new UI.
   */
  public verifierStatusText(verifier: Verifier): string | undefined {
    const result = this._node.statement.verifiers?.[verifier.id];
    return result?.status ?? verifier.statusPlaceholder;
  }

  public panelResultClass(verifier: Verifier): string {
    return verifierResultClass(
      this.treeService.verifierResult(this._node.statement, verifier.id),
    );
  }

  /**
   * The pre condition edited in the given verifier's panel: the node's own for the
   * Functional Verifier, the verifier-specific one otherwise.
   */
  public popupPrecondition(verifier: Verifier): BehaviorSubject<ICondition> {
    return verifier.id === FUNCTIONAL_VERIFIER_ID
      ? this._node.precondition
      : this._node.verifierPrecondition(verifier.id);
  }

  /**
   * The post condition edited in the given verifier's panel.
   * @see popupPrecondition
   */
  public popupPostcondition(verifier: Verifier): BehaviorSubject<ICondition> {
    return verifier.id === FUNCTIONAL_VERIFIER_ID
      ? this._node.postcondition
      : this._node.verifierPostcondition(verifier.id);
  }
}
