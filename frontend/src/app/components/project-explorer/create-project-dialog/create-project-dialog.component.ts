import {Component} from "@angular/core";
import {MatButtonModule} from "@angular/material/button";
import {ProjectService} from "../../../services/project/project.service";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {Button} from "primeng/button";
import {InputText} from "primeng/inputtext";
import {FloatLabel} from "primeng/floatlabel";

/**
 * Dialog for creating a new project, when pressing the save button in the project explorer without a known projectId
 * {@link https://material.angular.io/components/dialog/overview}
 */
@Component({
  selector: "app-create-project-dialog",
  imports: [
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    Button,
    InputText,
    FloatLabel,
  ],
  templateUrl: "./create-project-dialog.component.html",
  standalone: true,
  styleUrl: "./create-project-dialog.component.scss",
})
export class CreateProjectDialogComponent {
  public constructor(
    private projectService: ProjectService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  public confirm() {
    this.projectService.createProject();
    this.ref.close();
  }

  get projectname() {
    return this.projectService.projectname;
  }

  set projectname(name: string) {
    this.projectService.projectname = name;
  }
}
