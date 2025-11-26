import { Component, HostListener } from "@angular/core";

import { Router, RouterOutlet } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { TreeService } from "./services/tree/tree.service";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatBadgeModule } from "@angular/material/badge";
import { ProjectExplorerComponent } from "./components/project-explorer/project-explorer.component";
import { MatIconModule } from "@angular/material/icon";
import { NuMonacoEditorModule } from "@ng-util/monaco-editor";
import { ProjectService } from "./services/project/project.service";
import { NetworkTreeService } from "./services/tree/network/network-tree.service";
import { CreateProjectDialogComponent } from "./components/project-explorer/create-project-dialog/create-project-dialog.component";
import { first } from "rxjs";
import { NetworkStatusService } from "./services/networkStatus/network-status.service";
import { ConsoleService } from "./services/console/console.service";
import { EditorService } from "./services/editor/editor.service";
import { AiChatService } from "./services/ai-chat/ai-chat.service";
import { Toolbar } from "primeng/toolbar";
import { Button } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { DialogService } from "primeng/dynamicdialog";
import { SettingsButtonComponent } from "./components/settings/settings-button/settings-button.component";
import { Toast } from "primeng/toast";
import { MessageService } from "primeng/api";

/**
 * Top Component of this application,
 * this component includes the top bar and the routing element.
 * In which the editors and landing page get rendered in.
 */
@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    MatToolbarModule,
    Toolbar,
    MatSidenavModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ProjectExplorerComponent,
    MatIconModule,
    NuMonacoEditorModule,
    MatProgressBarModule,
    MatBadgeModule,
    Button,
    InputText,
    InputIcon,
    IconField,
    SettingsButtonComponent,
    Toast,
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
    private dialog: MatDialog,
    public dialogService: DialogService,
    protected router: Router,
    public projectService: ProjectService,
    private snackBar: MatSnackBar,
    private consoleService: ConsoleService,
    private editorService: EditorService,
    private aiChatService: AiChatService,
    private messageService: MessageService,
  ) {
    this.networkStatus.status.subscribe((status) => {
      if (status != this._loadingState) {
        this._loadingState = status;
      }
    });
  }

  public goHome(): void {
    this.router.navigate([""], { queryParamsHandling: "preserve" });
  }

  /**
   * Triggered on pressing the verify Button in the Top Bar.
   * Sideeffect: When the helper.key exists and no backend project connected prompt user to create project in the backend.
   * This is needed for the backend to use the contents of helper.key
   */
  public verify(): void {
    this.treeService.finalizeStatements();
    if (
      this.projectService.findByPath("helper.key") &&
      this.projectService.shouldCreateProject
    ) {
      this.projectService.requestFinished.pipe(first()).subscribe(() => {
        this.projectService.editorNotify.pipe(first()).subscribe(() => {
          this.networkTreeService.verify(
            this.treeService.rootFormula,
            this.projectService.projectId,
          );
        });

        this.projectService.uploadWorkspace();
      });
      this.openNewProjectDialog();
    } else {
      this.networkTreeService.verify(
        this.treeService.rootFormula,
        this.projectService.projectId,
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
      this.projectService.findByPath("helper.key") &&
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
   * Triggered on pressing the theme Button in the Top Bar.
   * Switches between light and dark theme
   */
  switchTheme() {
    const element = document.querySelector("html");
    element?.classList.toggle("dark-mode");
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

  public get consoleButtonColor() {
    return this.consoleService.numberOfLogs > 0 ? "rgb(186, 26, 26)" : "";
  }

  public get aiButtonColor() {
    return this.aiChatService.newMessages ? "rgb(186, 26, 26)" : "";
  }

  public getLoadingState(): "indeterminate" | "determinate" {
    return this._loadingState ? "indeterminate" : "determinate";
  }

  /**
   * Prevent closing the tab with not saved changes
   * @returns the permission to close the tab
   */
  @HostListener("window:beforeunload", ["$event"])
  public onClose(): boolean {
    this.projectService.editorNotify.next();
    if (this.projectService.isEmpty) {
      return true;
    }

    if (confirm("Are you sure to want to leave this editor")) {
      return true;
    }

    return false;
  }

  protected readonly Toolbar = Toolbar;
}
