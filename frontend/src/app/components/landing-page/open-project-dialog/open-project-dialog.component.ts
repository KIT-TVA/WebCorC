import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {ProjectService} from '../../../services/project/project.service';
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {Button} from "primeng/button";
import {FloatLabel} from "primeng/floatlabel";
import {InputText} from "primeng/inputtext";

/**
 * Dialog for opening a project based on the project id 
 * {@link https://material.angular.io/components/dialog/overview}
 */
@Component({
  selector: "app-open-project-dialog",
  imports: [FormsModule, Button, FloatLabel, InputText],
  templateUrl: "./open-project-dialog.component.html",
  standalone: true,
  styleUrl: "./open-project-dialog.component.scss",
})
export class OpenProjectDialogComponent {
  private _projectId: string = "";

  public constructor(
    private router: Router,
    private projectService: ProjectService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  public confirm() {
    this.projectService.projectId = this._projectId;

    this.projectService.downloadWorkspace();
    this.router.navigate([], {
      queryParams: { projectId: this._projectId },
    });
  }

  public get projectId() {
    return this._projectId;
  }

  public set projectId(projectId: string) {
    this._projectId = projectId;
  }
}
