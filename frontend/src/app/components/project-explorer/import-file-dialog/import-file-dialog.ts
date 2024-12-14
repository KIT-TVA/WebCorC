import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CbcFormulaMapperService } from '../../../services/project/mapper/cbc-formula-mapper.service';
import { CBCFormula, ICBCFormula } from '../../../services/project/CBCFormula';
import { ProjectService } from '../../../services/project/project.service';
import { ApiFileType } from '../../../services/project/types/api-elements';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-import-graph-dialog',
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatButtonModule],
    templateUrl: './import-file-dialog.component.html',
    styleUrl: './import-file-dialog.component.scss'
})
export class ImportFileDialogComponent {

  private fileContent : CBCFormula | string
  private fileName : string
  private fileType : ApiFileType

  public constructor(
    @Inject(MAT_DIALOG_DATA) public data : { parentURN : string },
    private _mapper: CbcFormulaMapperService, 
    private _projectService : ProjectService) {
    this.fileContent = ""
    this.fileName = ""
    this.fileType = "other"
  }

  private _accepted : boolean = false


  /* eslint-disable  @typescript-eslint/no-explicit-any */
  public async onFileSelected(event : any) {
    this._accepted = false
    console.log(this._accepted)
    const file : File = event.target?.files[0]

    if (!file) {
      return
    }

    const nameSplitted = file.name.split(".")
    if (nameSplitted.length < 3) {
      this._accepted = false
      return
    }

    const types = ["java", "key", "prove", "diagram", "other"]
    if (!(types.includes(nameSplitted[1]))) {
        this._accepted = false
        return
    }

    this.fileType = nameSplitted[1] as ApiFileType

    const content = await file.text()
    if (this.fileType == "diagram") {
      const parsed : ICBCFormula = JSON.parse(content)
      this.fileContent =  this._mapper.importFormula(parsed)
    } else {
      this.fileContent = content
    }

    this._accepted = true
    console.log(this._accepted)
    this.fileName = nameSplitted[0]
  }

  public confirm() {
    if (!this._accepted) return
    this._projectService.addFile(this.data.parentURN, this.fileName, this.fileType)
    if (this.data.parentURN === "/") { this.data.parentURN = "" }
    this._projectService.syncFileContent(this.data.parentURN + this.fileName + "." + this.fileType, this.fileContent)
  }

  public get accepted() : boolean {
    return this._accepted
  }
}
