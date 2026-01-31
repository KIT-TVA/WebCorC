import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  Signal,
  ViewChild,
  WritableSignal,
  Injector,
  runInInjectionContext,
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
import { GlobalSettingsService } from "../../../../services/global-settings.service";
import { NetworkTreeService } from "../../../../services/tree/network/network-tree.service";
import { ProjectService } from "../../../../services/project/project.service";
import { ICondition } from "../../../../types/condition/condition";
import { Subscription } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";

/**
 * Component to present the statements.
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
  ],
  templateUrl: "./statement.component.html",
  styleUrl: "./statement.component.scss",
  standalone: true,
})
export class StatementComponent implements OnInit, OnDestroy {
  @Input() public refinement!: Refinement;
  @Input() public hideSourceHandle = false;
  @Input() public hideTargetHandle = false;
  @Input() public icon = "pi pi-circle";
  @Input()
  set _node(value: AbstractStatementNode) {
    this._nodeValue = value;
    this.setupSignalsAndSubscriptions(value);
  }
  get _node(): AbstractStatementNode {
    return this._nodeValue;
  }
  private _nodeValue!: AbstractStatementNode;

  @Output() delete = new EventEmitter();

  @ViewChild("preconditionDrawer") private preconditionDrawer!: MatDrawer;
  @ViewChild("postconditionDrawer") private postconditionDrawer!: MatDrawer;
  @ViewChild("preconditionDiv") private preconditionDivRef!: ElementRef;
  @ViewChild("postconditionDiv") private postconditionDivRef!: ElementRef;

  public isVerifying = signal(false);

  preconditionSignal: WritableSignal<ICondition> = signal({ condition: '' });
  postconditionSignal: WritableSignal<ICondition> = signal({ condition: '' });
  preconditionEditableSignal!: Signal<boolean>;
  postconditionEditableSignal!: Signal<boolean>;

  private subscriptions = new Subscription();

  constructor(
    private treeService: TreeService,
    public globalSettingsService: GlobalSettingsService,
    private networkTreeService: NetworkTreeService,
    private projectService: ProjectService,
    private injector: Injector,
  ) {}

  ngOnInit(): void {
    // Initialization is handled by the _node setter
  }

  private setupSignalsAndSubscriptions(node: AbstractStatementNode) {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();

    runInInjectionContext(this.injector, () => {
      this.preconditionEditableSignal = toSignal(node.preconditionEditable, { initialValue: true });
      this.postconditionEditableSignal = toSignal(node.postconditionEditable, { initialValue: true });
    });

    this.preconditionSignal.set(node.precondition.getValue());
    this.postconditionSignal.set(node.postcondition.getValue());

    this.subscriptions.add(node.precondition.subscribe(val => {
      if (this.preconditionSignal() !== val) {
        this.preconditionSignal.set(val);
      }
    }));

    this.subscriptions.add(node.postcondition.subscribe(val => {
      if (this.postconditionSignal() !== val) {
        this.postconditionSignal.set(val);
      }
    }));
  }

  onPreconditionChange(newCondition: ICondition) {
    this.preconditionSignal.set(newCondition);
    if (this._nodeValue) {
      this._nodeValue.precondition.next(newCondition);
    }
  }

  onPostconditionChange(newCondition: ICondition) {
    this.postconditionSignal.set(newCondition);
    if (this._nodeValue) {
      this._nodeValue.postcondition.next(newCondition);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
    this.treeService.finalizeStatements();
    const tempFormula = this.treeService.createTempFormulaFromNode(this._node);
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
