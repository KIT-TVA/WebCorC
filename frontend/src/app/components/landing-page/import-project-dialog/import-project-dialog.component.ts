import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProjectService } from '../../../services/project/project.service';
import { ApiDirectory } from '../../../services/project/types/api-elements';
import { ConsoleService } from '../../../services/console/console.service';

/**
 * Dialog for importing a project created with this editor
 * {@link https://material.angular.io/components/dialog/overview}
 */
@Component({
  selector: 'app-import-project-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './import-project-dialog.component.html',
  styleUrl: './import-project-dialog.component.scss'
})
export class ImportProjectDialogComponent {

  private _accepted : boolean = false
  private _projectname : string = ""
  private _rootDir : ApiDirectory = new ApiDirectory("", [])

  public constructor(
    private projectService : ProjectService,
    private consoleService : ConsoleService) {

  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  public async onFileSelected(event : any) {
    this._accepted = false

    const file : File = event.target?.files[0]

    if (!file) {
      return
    }

    try {
      this._rootDir = JSON.parse(await file.text())
      const nameSplitted = file.name.split(".")
      this._projectname = nameSplitted[0]
      this._accepted = true
    } catch {
      this.consoleService.addStringError("no project file", "import project from file")
      this._accepted = false
    }
  }

  public confirm() {
    if (!this._accepted) return
    this.projectService.import(this._rootDir, this._projectname)
  }

  public get accepted() : boolean {
    return this._accepted
  }

  public set accepted(accepted : boolean) {
    this._accepted = accepted
  }


  public get projectname() {
    return this._projectname
  }

  public set projectname(projectname : string) {
    this._projectname = projectname
  }
}
