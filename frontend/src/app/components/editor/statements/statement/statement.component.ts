import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  signal,
  ViewChild,
} from "@angular/core";

import { MatGridListModule } from "@angular/material/grid-list";
import { Refinement } from "../../../../types/refinement";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormBuilder, FormsModule } from "@angular/forms";
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
import { SplitButtonModule } from "primeng/splitbutton"
import { ToggleButtonModule } from "primeng/togglebutton"
import { Popover, PopoverModule } from "primeng/popover"
import { Toolbar } from "primeng/toolbar";
import { GlobalSettingsService } from "../../../../services/global-settings.service";
import { NetworkJobService } from "../../../../services/tree/network/network-job.service";
import { ProjectService } from "../../../../services/project/project.service";
import { AsyncPipe } from "@angular/common";
import { AiChatService } from "../../../../services/ai-chat/ai-chat.service";
import { SimpleStatementNode } from "../../../../types/statements/nodes/simple-statement-node";
import { ConfidentialityLattice, defaultConfidentialityLattice, defaultIntegrityLattice, ILattice, IntegrityLattice } from "../../../../types/ifbc/lattice";
import { VariableIFbCState } from "../../../../types/ifbc/variableState";
import { ConfidentialityEditorComponent } from "../../confidentiality/confidentiality-editor/confidentiality-editor.component";
import { MenuItem } from "primeng/api";
import { LevelEditorComponent } from "../../confidentiality/level-editor/level-editor.component";
import { Tag } from "primeng/tag"
import { Fieldset } from "primeng/fieldset";
import { Divider } from "primeng/divider";
import { IFbCService } from "../../../../services/ifbc/ifbc.service";

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
    ConfidentialityEditorComponent,
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
    SplitButtonModule,
    ToggleButtonModule,
    PopoverModule,
    LevelEditorComponent,
    Tag,
    Fieldset,
    Divider
],
  templateUrl: "./statement.component.html",
  styleUrl: "./statement.component.css",
  standalone: true,
})
export class StatementComponent {
  private static readonly EDITOR_CONTAINER_EXPANSION_TRIGGER = 150;
  private static readonly EDITOR_CONTAINER_EXPANSION = 200;

  @Input() public refinement!: Refinement;
  @Input() public hideSourceHandle = false;
  @Input() public hideTargetHandle = false;
  @Input() public isRoot = false;
  @Input({ required: true }) _node!: AbstractStatementNode;
  @Input() public icon = "pi pi-circle";

  @Output() delete = new EventEmitter();

  @ViewChild("preconditionDrawer") private preconditionDrawer!: MatDrawer;
  @ViewChild("postconditionDrawer") private postconditionDrawer!: MatDrawer;
  @ViewChild("preconditionDiv") private preconditionDivRef!: ElementRef;
  @ViewChild("postconditionDiv") private postconditionDivRef!: ElementRef;
  @ViewChild("ifbcPopover") public ifbcPopover?: Popover;

  public isVerifying = signal(false);
  public statementInfoVisible = false;

    /**
   * Forms Template
   */
  private _variables: string[] = []
  public preVariables: VariableIFbCState = { confidentiality: {}, integrity: {} }
  public postVariables: VariableIFbCState = { confidentiality: {}, integrity: {} }
  private _confidentialityLattice: ConfidentialityLattice = defaultConfidentialityLattice;
  private _integrityLattice: IntegrityLattice = defaultIntegrityLattice;
  ifbcButtonOptions: MenuItem[] = []

  constructor(
    private treeService: TreeService,
    private aiChatService: AiChatService,
    public globalSettingsService: GlobalSettingsService,
    private networkTreeService: NetworkJobService,
    private projectService: ProjectService,
    private latticeService: IFbCService,
  ) {

    this.ifbcButtonOptions = [
      {
        label: "Check confidentiality only",
        command: () => {
          this.latticeService.verifyConfidentiality(true, false);
        }
      },
      {
        label: "Check integrity only",
        command: () => {
          this.latticeService.verifyConfidentiality(false, true);
        }
      }
    ]
  }

  ngOnInit(): void {
    this._variables = this.treeService.variables
    this.treeService.variableUpdateNotifier.subscribe(() => {
      this._variables = this.treeService.variables
    })

    if (this.isRoot) {
      this.latticeService.confidentialityLattice.subscribe((lattice) => {
        this._confidentialityLattice = lattice;
      })
      this.latticeService.integrityLattice.subscribe((lattice) => {
        this._integrityLattice = lattice;
      })
      this.latticeService.preVariableState.subscribe((state) => {
        this.preVariables = state
      });
      this.latticeService.postVariableState.subscribe((state) => {
        this.postVariables = state
      });
    }
  }

  public get variables(): unknown[] {
    return this._variables;
  }

  public get confidentialityLattice(): ILattice {
    return this._confidentialityLattice
  }

  public get integrityLattice(): ILattice {
    return this._integrityLattice
  }

  public get statementInfo(): AbstractStatementNode['statementInfo'] {
    return this._node.statementInfo
  }

  public get isCheckingIFbC(): boolean {
    return this.latticeService.isCheckingConfidentiality()
  }

  public get isCompatibleWithFinalPostState(): boolean {
    return (this._node.statementInfo.confidentiality?.compatibleWithPostState ?? true) 
      && (this._node.statementInfo.integrity?.compatibleWithPostState ?? true) 
  }

  public verifyConfidentiality(
        checkConfidentiality: boolean,
        checkIntegrity: boolean,
  ): void {
    this.latticeService.verifyConfidentiality(checkConfidentiality, checkIntegrity);
  }

  public updateVariableState() {
    this.latticeService.storePreVariableState(this.preVariables);
    this.latticeService.storePostVariableState(this.postVariables);
  }

  public deleteRefinement(): void {
    this.treeService.deleteStatementNode(this._node);
    this.delete.emit();
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

  public verifyStatement(): void {
    if (this.isVerifying()) {
      return;
    }
    this.isVerifying.set(true);

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

  public get showSynthesisButton(): boolean {
    if (this._node.statement.type === "SKIP") return false;
    return this._node.children.filter((c) => c !== undefined).length === 0;
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
}
