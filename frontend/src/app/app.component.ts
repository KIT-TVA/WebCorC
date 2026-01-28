import { Component, HostListener } from "@angular/core";

import { Router, RouterOutlet } from "@angular/router";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormsModule } from "@angular/forms";
import { TreeService } from "./services/tree/tree.service";
import { ProjectExplorerComponent } from "./components/project-explorer/project-explorer.component";
import { NuMonacoEditorModule } from "@ng-util/monaco-editor";
import { ProjectService } from "./services/project/project.service";
import { NetworkTreeService } from "./services/tree/network/network-tree.service";
import { CreateProjectDialogComponent } from "./components/project-explorer/create-project-dialog/create-project-dialog.component";
import { first } from "rxjs";
import { NetworkStatusService } from "./services/networkStatus/network-status.service";
import { Toolbar } from "primeng/toolbar";
import { Button } from "primeng/button";
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { DialogService } from "primeng/dynamicdialog";
import { SettingsButtonComponent } from "./components/settings/settings-button/settings-button.component";
import { Toast } from "primeng/toast";
import { MessageService } from "primeng/api";
import { InputText } from "primeng/inputtext";

/**
 * Top Component of this application,
 * this component includes the top bar and the routing element.
 * In which the editors and landing page get rendered in.
 */
@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    Toolbar,
    MatSidenavModule,
    FormsModule,
    ProjectExplorerComponent,
    NuMonacoEditorModule,
    Button,
    InputIcon,
    IconField,
    SettingsButtonComponent,
    Toast,
    InputText,
  ],
  templateUrl: "./app.component.html",
  providers: [DialogService, MessageService],
  standalone: true,
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  private _loadingState = false;

  constructor(
    public treeService: TreeService,
    private networkTreeService: NetworkTreeService,
    private networkStatus: NetworkStatusService,
    public dialogService: DialogService,
    protected router: Router,
    public projectService: ProjectService,
    private snackBar: MatSnackBar,
  ) {
    this.networkStatus.status.subscribe((status) => {
      if (status != this._loadingState) {
        this._loadingState = status;
      }
    });
  }
  /**
   * Triggered on pressing the verify Button in the Top Bar.
   * Sideeffect: When the helper.key exists and no backend project connected prompt user to create project in the backend.
   * This is needed for the backend to use the contents of helper.key
   */
  public verify(): void {
    this.treeService.finalizeStatements();
    if (
      this.projectService.findByUrn("helper.key") &&
      this.projectService.shouldCreateProject
    ) {
      this.projectService.requestFinished.pipe(first()).subscribe(() => {
        this.projectService.editorNotify.pipe(first()).subscribe(() => {
          this.networkTreeService.verify(
            this.treeService.rootFormula,
            this.projectService.projectId,
            this.treeService.urn,
          );
        });

        this.projectService.uploadWorkspace();
      });
      this.openNewProjectDialog();
    } else {
      this.networkTreeService.verify(
        this.treeService.rootFormula,
        this.projectService.projectId,
        this.treeService.urn,
      );
    }
  }

  private openNewProjectDialog() {
    this.dialogService.open(CreateProjectDialogComponent, {
      header: "Select Project",
      modal: true,
    });
  }

  /**
   * Triggered on pressing the generate Button in the Top Bar.
   * Sideeffect: When the helper.key exists and no backend project connected prompt user to create project in the backend.
   * This is needed for the backend to use the contents of helper.key
   */
  public generateCode(): void {
    if (
      this.projectService.findByUrn("helper.key") &&
      this.projectService.shouldCreateProject
    ) {
      this.projectService.requestFinished.pipe(first()).subscribe(() => {
        this.projectService.editorNotify.pipe(first()).subscribe(() => {
          this.networkTreeService.generateCode(
            this.treeService.rootFormula,
            this.projectService.projectId,
          );
        });

        this.projectService.uploadWorkspace();
      });
      this.openNewProjectDialog();
    } else {
      this.networkTreeService.generateCode(
        this.treeService.rootFormula,
        this.projectService.projectId,
      );
    }
  }

  private writeURLintoClipboard() {
    navigator.clipboard.writeText(
      window.origin + "?projectId=" + this.projectService.projectId,
    );
    this.snackBar.open("Copied project url", "Dismiss", {
      horizontalPosition: "end",
      verticalPosition: "bottom",
      duration: 5000,
    });
  }

  /**
   * Write the url of the current project into the clipboard.
   * Sideeffect: When no project id defined create project and upload current content to backend.
   */
  public share() {
    let wait = false;
    if (this.projectService.shouldCreateProject) {
      this.projectService.requestFinished.pipe(first()).subscribe(() => {
        this.writeURLintoClipboard();
      });
      this.openNewProjectDialog();
      wait = true;
    }

    if (!wait) {
      this.projectService.editorNotify.pipe(first()).subscribe(() => {
        this.writeURLintoClipboard();
      });
    }

    this.projectService.uploadWorkspace(wait);
  }

  /**
   * Prevent closing the tab with not saved changes
   * @returns the permission to close the tab
   * commented out because slows debugging
   */
  /*
  @HostListener("window:beforeunload", ["$event"])
  public onClose(): boolean {
    this.projectService.editorNotify.next();
    if (this.projectService.isEmpty) {
      return true;
    }

    return confirm("Are you sure to want to leave this editor");
  }*/
}
