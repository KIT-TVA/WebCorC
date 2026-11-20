import { Component, OnInit, inject } from "@angular/core";

import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormsModule } from "@angular/forms";
import { TreeService } from "./services/tree/tree.service";
import { ProjectExplorerComponent } from "./components/project-explorer/project-explorer.component";
import { NuMonacoEditorModule } from "@ng-util/monaco-editor";
import { ProjectService } from "./services/project/project.service";
import { NetworkJobService } from "./services/tree/network/network-job.service";
import { CreateProjectDialogComponent } from "./components/project-explorer/create-project-dialog/create-project-dialog.component";
import { first } from "rxjs";
import { Toolbar } from "@openng/optimus-ui/toolbar";
import { Button } from "@openng/optimus-ui/button";
import { InputIcon } from "@openng/optimus-ui/inputicon";
import { IconField } from "@openng/optimus-ui/iconfield";
import { DialogService } from "@openng/optimus-ui/dynamicdialog";
import { SettingsButtonComponent } from "./components/settings/settings-button/settings-button.component";
import { Toast } from "@openng/optimus-ui/toast";
import { MessageService, ConfirmationService } from "@openng/optimus-ui/api";
import { InputText } from "@openng/optimus-ui/inputtext";
import { GlobalSettingsService } from "./services/global-settings.service";
import { ConfirmDialog } from "@openng/optimus-ui/confirmdialog";
import { PredicateService } from "./services/predicates/predicate.service";

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
    ConfirmDialog,
  ],
  templateUrl: "./app.component.html",
  providers: [DialogService, MessageService, ConfirmationService],
  standalone: true,
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  treeService = inject(TreeService);
  private networkTreeService = inject(NetworkJobService);
  dialogService = inject(DialogService);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);
  protected globalSettingsService = inject(GlobalSettingsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private predicateService = inject(PredicateService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  public ngOnInit(): void {
    // Download workspace if project id is set
    this.route.queryParams.subscribe((params) => {
      const id = params["projectId"];
      if (id) {
        this.projectService.projectId = id;
        this.projectService.downloadWorkspace();
      }
    });
    this.projectService.downloadWorkspace();
  }
  /**
   * Triggered on pressing the verify Button in the Top Bar.
   * The backend reads the include, Java source and proof files of the project from storage,
   * so the project is always saved before verifying. Otherwise the backend would verify
   * against stale files (e.g. those of a previously loaded example).
   * Sideeffect: When no backend project is connected the user is prompted to create one.
   */
  public verify(): void {
    this.treeService.finalizeStatements();
    if (this.projectService.shouldCreateProject) {
      this.confirmationService.confirm({
        message:
          "You have unsaved changes. Do you want to save them before verifying?",
        header: "Unsaved Changes",
        icon: "pi pi-exclamation-triangle",
        accept: () => {
          this.openNewProjectDialog()?.onClose.subscribe((created) => {
            if (created) {
              this.saveAndVerify();
            } else {
              this.messageService.add({
                summary: "Save cancelled",
                detail: "No project specified to save to",
                severity: "warn",
              });
            }
          });
        },
        reject: () => this.startVerification(),
      });
    } else {
      this.saveAndVerify();
    }
  }

  /**
   * Save the current project to the backend and verify the currently opened diagram afterwards.
   */
  private saveAndVerify(): void {
    this.globalSettingsService.isVerifying = true;
    this.predicateService.exportPredicates();
    this.projectService.uploadWorkspace().then(
      () => {
        this.messageService.add({
          summary: "Save successful",
          severity: "success",
        });
        this.startVerification();
      },
      () => {
        this.globalSettingsService.isVerifying = false;
        this.messageService.add({
          summary: "Save failed",
          detail:
            "The project could not be saved, verification was not started",
          severity: "error",
        });
      },
    );
  }

  private startVerification(): void {
    this.globalSettingsService.isVerifying = true;
    this.networkTreeService.verify(
      this.treeService.rootFormula,
      this.projectService.projectId,
      this.treeService.urn,
    );
  }

  private openNewProjectDialog() {
    return this.dialogService.open(CreateProjectDialogComponent, {
      header: "Select Project",
      modal: true,
      closable: true,
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
    if (!this.projectService.shouldCreateProject) {
      this.writeURLintoClipboard();
    }
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
