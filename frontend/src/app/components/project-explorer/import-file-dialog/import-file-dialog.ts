import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CbcFormulaMapperService } from '../../../services/project/mapper/cbc-formula-mapper.service';
import { CBCFormula, ICBCFormula } from '../../../types/CBCFormula';
import { ProjectService } from '../../../services/project/project.service';
import { ApiFileType } from '../../../services/project/types/api-elements';
import { MatButtonModule } from '@angular/material/button';
import { NetworkTreeService } from '../../../services/tree/network/network-tree.service';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ConsoleService } from '../../../services/console/console.service';

/**
 * Dialog for importing files created with this editor or cbcmodels created with the corc editor
 * {@link https://material.angular.io/components/dialog/overview}
 */
@Component({
    selector: 'app-import-graph-dialog',
    imports: [MatDialogModule, MatFormFieldModule, MatButtonModule, MatInputModule, FormsModule],
    templateUrl: './import-file-dialog.component.html',
    styleUrl: './import-file-dialog.component.scss'
})
export class ImportFileDialogComponent {

  private _fileContent : CBCFormula | string
  private _fileName : string
  private _fileType : ApiFileType

  public constructor(
    @Inject(MAT_DIALOG_DATA) public data : { parentURN : string },
    private _mapper: CbcFormulaMapperService, 
    private _projectService : ProjectService,
    private _treeNetworkService : NetworkTreeService,
    private _consoleService : ConsoleService) {
    this._fileContent = ""
    this._fileName = ""
    this._fileType = "other"
  }

  private _accepted : boolean = false

  private async handleWebCorcFile(file : File, nameSplitted : string[]) {

    this._fileType = nameSplitted[1] as ApiFileType
    try {
      const content = await file.text()
      if (this._fileType == "diagram") {
        const parsed : ICBCFormula = JSON.parse(content)
        this._fileContent =  this._mapper.importFormula(parsed)
      } else {
        this._fileContent = content
      }
  
      this._accepted = true
      this._fileName = nameSplitted[0]
    } catch {
      this._consoleService.addStringError("no valid corc file", "import file into project")
    }
      

  }


  /* eslint-disable  @typescript-eslint/no-explicit-any */
  public async onFileSelected(event : any) {
    this._accepted = false
    const file : File = event.target?.files[0]

    if (!file) {
      return
    }

    const nameSplitted = file.name.split(".")

    if (nameSplitted.length == 2 && nameSplitted[1] == "cbcmodel") {
      // Removed this.handleCbcModelFile(file , nameSplitted)
      return
    }

    if (nameSplitted.length < 3) {
      this._accepted = false
      return
    }

    const types = ["java", "key", "prove", "diagram", "other"]
    if (!(types.includes(nameSplitted[1]))) {
        this._accepted = false
        return
    }

    this.handleWebCorcFile(file, nameSplitted)
  }

  public confirm() {
    if (!this._accepted) return
    this._projectService.addFile(this.data.parentURN, this.fileName, this._fileType)
    if (this.data.parentURN === "/") { this.data.parentURN = "" }
    this._projectService.syncFileContent(this.data.parentURN + this.fileName + "." + this._fileType, this._fileContent)
  }

  public get accepted() : boolean {
    return this._accepted
  }

  public get fileName() : string {
    return this._fileName
  }

  public set fileName(name : string) {
    this._fileName = name
  }

  public get fileType() : string {
    if (this._fileName == "" && this._fileType == "other") {
      return ""
    }
    return "." + this._fileType
  }
}
