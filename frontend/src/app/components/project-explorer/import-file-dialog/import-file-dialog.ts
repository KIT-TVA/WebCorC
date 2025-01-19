import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CbcFormulaMapperService } from '../../../services/project/mapper/cbc-formula-mapper.service';
import { CBCFormula, ICBCFormula } from '../../../services/project/CBCFormula';
import { ProjectService } from '../../../services/project/project.service';
import { ApiFileType } from '../../../services/project/types/api-elements';
import { MatButtonModule } from '@angular/material/button';
import { NetworkTreeService } from '../../../services/tree/network/network-tree.service';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-import-graph-dialog',
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatButtonModule, MatInputModule, FormsModule],
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
    private _treeNetworkService : NetworkTreeService) {
    this._fileContent = ""
    this._fileName = ""
    this._fileType = "other"
  }

  private _accepted : boolean = false

  private async handleWebCorcFile(file : File, nameSplitted : string[]) {

    this._fileType = nameSplitted[1] as ApiFileType

    const content = await file.text()
    if (this._fileType == "diagram") {
      const parsed : ICBCFormula = JSON.parse(content)
      this._fileContent =  this._mapper.importFormula(parsed)
    } else {
      this._fileContent = content
    }

    this._accepted = true
    this._fileName = nameSplitted[0]      

  }

  private async handleCbcModelFile(file : File, nameSplitted : string[]) {

    this._fileType = "diagram"

    this._accepted = false
    const content = await file.text()

    this._treeNetworkService.conversionResponse.subscribe((formula : CBCFormula) => {
      this._fileName = nameSplitted[0]
      this._fileContent = formula
      this._accepted = true
    })

    this._treeNetworkService.convertCBCModel(content)
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
      this.handleCbcModelFile(file , nameSplitted)
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
