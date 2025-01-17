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
    private _projectService : ProjectService,
    private _treeNetworkService : NetworkTreeService) {
    this.fileContent = ""
    this.fileName = ""
    this.fileType = "other"
  }

  private _accepted : boolean = false

  private async handleWebCorcFile(file : File, nameSplitted : string[]) {

    this.fileType = nameSplitted[1] as ApiFileType

    const content = await file.text()
    if (this.fileType == "diagram") {
      const parsed : ICBCFormula = JSON.parse(content)
      this.fileContent =  this._mapper.importFormula(parsed)
    } else {
      this.fileContent = content
    }

    this._accepted = true
    this.fileName = nameSplitted[0]      

  }

  private async handleCbcModelFile(file : File, nameSplitted : string[]) {

    this.fileType = "diagram"

    this._accepted = false
    const content = await file.text()

    this._treeNetworkService.conversionResponse.subscribe((formula : CBCFormula) => {
      this.fileName = nameSplitted[0]
      this.fileContent = formula
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
    this._projectService.addFile(this.data.parentURN, this.fileName, this.fileType)
    if (this.data.parentURN === "/") { this.data.parentURN = "" }
    this._projectService.syncFileContent(this.data.parentURN + this.fileName + "." + this.fileType, this.fileContent)
  }

  public get accepted() : boolean {
    return this._accepted
  }
}
