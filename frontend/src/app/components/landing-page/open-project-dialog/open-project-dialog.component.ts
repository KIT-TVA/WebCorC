import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../services/project/project.service';

@Component({
  selector: 'app-open-project-dialog',
  imports: [CommonModule, MatDialogModule, FormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
  templateUrl: './open-project-dialog.component.html',
  styleUrl: './open-project-dialog.component.scss'
})
export class OpenProjectDialogComponent {

  private _projectId : string = ""

  public constructor(private router : Router, private projectService : ProjectService) {}

  public confirm() {

    this.projectService.projectId = this._projectId

    this.projectService.downloadWorkspace()
    this.router.navigate([], {
      queryParams: {  projectId : this._projectId }
    })
  }

  public get projectId() {
    return this._projectId
  }

  public set projectId(projectId : string) {
    this._projectId = projectId
  }
}
