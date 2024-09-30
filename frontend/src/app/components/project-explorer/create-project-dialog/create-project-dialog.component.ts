import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { ProjectService } from '../../../services/project/project.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatInputModule, MatFormFieldModule, FormsModule],
  templateUrl: './create-project-dialog.component.html',
  styleUrl: './create-project-dialog.component.scss'
})
export class CreateProjectDialogComponent {


  constructor(private projectService : ProjectService, private dialog : MatDialogRef<CreateProjectDialogComponent>) {}


  public confirm() {
    this.projectService.createProject()
  }

  get projectname() {
    return this.projectService.projectname
  }

  set projectname(name : string) {
    this.projectService.projectname = name
  }

}
