import { Component } from "@angular/core";
import { ProjectService } from "../../../services/project/project.service";
import { FormsModule } from "@angular/forms";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { Button } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { FloatLabel } from "primeng/floatlabel";

/**
 * Dialog for creating a new project, when pressing the save button in the project explorer without a known projectId
 */
@Component({
  selector: "app-create-project-dialog",
  imports: [FormsModule, Button, InputText, FloatLabel],
  templateUrl: "./create-project-dialog.component.html",
  standalone: true,
  styleUrl: "./create-project-dialog.component.css",
})
export class CreateProjectDialogComponent {
  protected loading = false;
  public constructor(
    private projectService: ProjectService,
    public ref: DynamicDialogRef<boolean>,
    public config: DynamicDialogConfig,
  ) {}

  public confirm() {
    this.loading = true;
    this.projectService
      .createProject()
      .then(() => this.ref.close(true))
      .finally(() => (this.loading = false));
  }

  get projectname() {
    return this.projectService.projectName;
  }

  set projectname(name: string) {
    this.projectService.projectName = name;
  }
}
