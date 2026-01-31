import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  signal,
  ViewChild,
} from '@angular/core';

import { MatGridListModule } from '@angular/material/grid-list';
import { Refinement } from '../../../../types/refinement';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ConditionEditorComponent } from '../../condition/condition-editor/condition-editor.component';
import { TreeService } from '../../../../services/tree/tree.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { AbstractStatementNode } from '../../../../types/statements/nodes/abstract-statement-node';
import { HandleComponent } from 'ngx-vflow';
import { GridTileBorderDirective } from '../../../../directives/grid-tile-border.directive';
import { Card } from 'primeng/card';
import {
  Button,
  ButtonDirective,
  ButtonIcon,
  ButtonLabel,
} from 'primeng/button';
import { Toolbar } from 'primeng/toolbar';
import { GlobalSettingsService } from '../../../../services/global-settings.service';
import { NetworkTreeService } from '../../../../services/tree/network/network-tree.service';
import { ProjectService } from '../../../../services/project/project.service';
import { AsyncPipe } from '@angular/common';

/**
 * Component to present the statements.
 * This component is only to show the statement given.
 * It is used as the template for the statements.
 * This is not the (super) type Refinement.
 */
@Component({
  selector: 'app-statement-base',
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
  ],
  templateUrl: './statement.component.html',
  styleUrl: './statement.component.scss',
  standalone: true,
})
export class StatementComponent {
  private static readonly EDITOR_CONTAINER_EXPANSION_TRIGGER = 150;
  private static readonly EDITOR_CONTAINER_EXPANSION = 200;

  @Input() public refinement!: Refinement;
  @Input() public hideSourceHandle = false;
  @Input() public hideTargetHandle = false;
  @Input({ required: true }) _node!: AbstractStatementNode;
  @Input() public icon = 'pi pi-circle';

  @Output() delete = new EventEmitter();

  @ViewChild('preconditionDrawer') private preconditionDrawer!: MatDrawer;
  @ViewChild('postconditionDrawer') private postconditionDrawer!: MatDrawer;
  @ViewChild('preconditionDiv') private preconditionDivRef!: ElementRef;
  @ViewChild('postconditionDiv') private postconditionDivRef!: ElementRef;

  public isVerifying = signal(false);

  constructor(
    private treeService: TreeService,
    public globalSettingsService: GlobalSettingsService,
    private networkTreeService: NetworkTreeService,
    private projectService: ProjectService,
  ) {}

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
      editorRef.nativeElement.style.width = '50px';
    } else {
      editorRef.nativeElement.style.width = '';
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

  compactButton = {
    root: {
      sm: {
        paddingX: '0.2rem',
      },
      paddingX: '0px',
    },
    button: {
      paddingX: '0px',
      root: {
        sm: {
          paddingX: '0px',
        },
      },
    },
  };
}
