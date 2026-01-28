import { Component, OnInit } from "@angular/core";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute } from "@angular/router";
import { ProjectService } from "../../services/project/project.service";
import { MatDialog } from "@angular/material/dialog";
import { OpenProjectDialogComponent } from "./open-project-dialog/open-project-dialog.component";
import { ImportProjectDialogComponent } from "./import-project-dialog/import-project-dialog.component";
import { LoadExampleDialogComponent } from "./load-example-dialog/load-example-dialog.component";
import { ImportFileDialogComponent } from "../project-explorer/import-file-dialog/import-file-dialog";
import { Card } from "primeng/card";
import { MenuItem } from "primeng/api";
import { Divider } from "primeng/divider";
import { ButtonDirective, ButtonIcon, ButtonLabel } from "primeng/button";
import { Menubar } from "primeng/menubar";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { LocalCBCFormula } from "../../types/CBCFormula";
import { LocalDirectory } from "../../services/project/types/api-elements";

@Component({
  selector: "app-landing-page",
  imports: [
    MatButtonModule,
    MatIconModule,
    Card,
    Divider,
    ButtonDirective,
    ButtonLabel,
    ButtonIcon,
    Menubar,
  ],
  providers: [DialogService],
  templateUrl: "./landing-page.component.html",
  standalone: true,
  styleUrl: "./landing-page.component.scss",
})
export class LandingPageComponent implements OnInit {
  /**
   * Landingpage infront of the editors to prevent file not found errors,
   * this component is mounted at the root / of the url path and so the default page for users
   * to see.
   */
  public constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private dialog: MatDialog,
    public dialogService: DialogService,
  ) {}

  dialogRef: DynamicDialogRef | undefined;

  public actions: MenuItem[] = [
    {
      label: "Load Example",
      icon: "pi pi-lightbulb",
      command: () => this.loadExampleDialog(),
    },
    {
      label: "Import File",
      icon: "pi pi-file-import",
      command: () => this.importFileDialog(),
    },
    {
      label: "Import Project",
      icon: "pi pi-book",
      command: () => this.importProjectDialog(),
    },
    {
      label: "Open Project",
      icon: "pi pi-folder-open",
      command: () => this.openProjectDialog(),
    },
  ];

  public ngOnInit(): void {
    // read the query Params and setting them to the projectService
    this.route.queryParams.subscribe((params) => {
      this.projectService.projectId = params["projectId"];
    });

    // if the projectId is not undefined load the project from the backend
    this.projectService.downloadWorkspace();
  }

  public openProjectDialog() {
    this.dialogService.open(OpenProjectDialogComponent, {
      header: "Open Project",
      modal: true,
    });
  }

  public importProjectDialog() {
    this.dialogService.open(ImportProjectDialogComponent, {
      header: "Import Project",
      modal: true,
    });
  }

  public importFileDialog() {
    this.dialogService.open(ImportFileDialogComponent, {
      data: { parentURN: "/" },
      header: "Import File",
      modal: true,
    });
  }

  public loadExampleDialog() {
    const dialogRef = this.dialogService.open(LoadExampleDialogComponent, {
      header: "Load Example",
      modal: true,
    });

    dialogRef?.onClose.subscribe((selectedExample) => {
      if (selectedExample) {
        this.projectService.importProject(
          LocalDirectory.fromApi(selectedExample.project),
          selectedExample.name,
        );
      }
    });
  }
}
