import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
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
import { AbstractStatement } from "../../../../types/statements/abstract-statement";
import { AbstractStatementNode } from "../../../../types/statements/nodes/abstract-statement-node";
import { HandleComponent } from "ngx-vflow";
import { GridTileBorderDirective } from "../../../../directives/grid-tile-border.directive";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { Toolbar } from "primeng/toolbar";
import { GlobalSettingsService } from "../../../../services/global-settings.service";

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
  ],
  templateUrl: "./statement.component.html",
  styleUrl: "./statement.component.scss",
  standalone: true,
})
export class StatementComponent {
  private static readonly EDITOR_CONTAINER_EXPANSION_TRIGGER = 150;
  private static readonly EDITOR_CONTAINER_EXPANSION = 200;

  @Input() public refinement!: Refinement;
  @Input() public hideSourceHandle = false;
  @Input() public hideTargetHandle = false;
  @Input({ required: true }) _node!: AbstractStatementNode;
  @Input() public icon = "pi pi-circle";

  @Output() delete = new EventEmitter();

  @ViewChild("preconditionDrawer") private preconditionDrawer!: MatDrawer;
  @ViewChild("postconditionDrawer") private postconditionDrawer!: MatDrawer;
  @ViewChild("preconditionDiv") private preconditionDivRef!: ElementRef;
  @ViewChild("postconditionDiv") private postconditionDivRef!: ElementRef;

  constructor(
    private treeService: TreeService,
    public globalSettingsService: GlobalSettingsService,
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
      editorRef.nativeElement.style.width = "50px";
    } else {
      editorRef.nativeElement.style.width = "";
      drawer.toggle();
    }
  }

  //TODO reimplement this
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private setVerifcationState(statement: AbstractStatement) {
    /*if (this.refinement.id == statement.id) {
      this.refinement.proven = statement.proven
      if (this.refinement.proven) {
        this.boxTitleRef.nativeElement.style.backgroundColor = "rgb(140,182,60)";
        this.refinementBoxRef.nativeElement.style.borderColor = "rgb(140,182,60)";
      } else {
        this.boxTitleRef.nativeElement.style.backgroundColor = "rgb(163,34,35)";
        this.refinementBoxRef.nativeElement.style.borderColor = "rgb(163,34,35)";
      }
    }*/
  }
}
