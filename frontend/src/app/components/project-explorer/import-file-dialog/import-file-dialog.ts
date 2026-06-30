import { Component } from "@angular/core";
import { CbcFormulaMapperService } from "../../../services/project/mapper/cbc-formula-mapper.service";
import { ICBCFormula, LocalCBCFormula } from "../../../types/CBCFormula";
import { ProjectService } from "../../../services/project/project.service";
import { ApiFileType } from "../../../services/project/types/api-elements";
import { FormsModule } from "@angular/forms";
import { ConsoleService } from "../../../services/console/console.service";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { Button } from "primeng/button";
import { FileUpload } from "primeng/fileupload";

/**
 * Dialog for importing files created with this editor or cbcmodels created with the corc editor
 * {@link https://material.angular.io/components/dialog/overview}
 */
@Component({
  selector: "app-import-graph-dialog",
  imports: [FormsModule, Button, FileUpload],
  templateUrl: "./import-file-dialog.component.html",
  standalone: true,
  styleUrl: "./import-file-dialog.component.css",
})
export class ImportFileDialogComponent {
  private _fileContent: LocalCBCFormula | string;
  private _fileName: string;
  private _fileType: ApiFileType;

  public constructor(
    private _mapper: CbcFormulaMapperService,
    private _projectService: ProjectService,
    private _consoleService: ConsoleService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    this._fileContent = "";
    this._fileName = "";
    this._fileType = "other";
  }

  private _accepted: boolean = false;

  private async handleWebCorcFile(file: File, nameSplitted: string[]) {
    this._fileType = nameSplitted[1] as ApiFileType;
    try {
      const content = await file.text();
      if (this._fileType == "diagram") {
        const parsed: ICBCFormula = JSON.parse(content);
        this._fileContent = this._mapper.importFormula(parsed);
      } else {
        this._fileContent = content;
      }

      this._accepted = true;
      this._fileName = nameSplitted[0];
    } catch {
      this._consoleService.addStringError(
        "no valid corc file",
        "import file into project",
      );
    }
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  public async onFileSelected(event: any) {
    console.log(event);
    this._accepted = false;
    const file: File = event.files[0];

    console.log("file selected");

    if (!file) {
      return;
    }

    const nameSplitted = file.name.split(".");

    if (nameSplitted.length == 2 && nameSplitted[1] == "cbcmodel") {
      this._accepted = true;
      // Removed this.handleCbcModelFile(file , nameSplitted)
      return;
    }

    if (nameSplitted.length < 3) {
      this._accepted = false;
      return;
    }

    const types = ["java", "key", "prove", "diagram", "other"];
    if (!types.includes(nameSplitted[1])) {
      this._accepted = false;
      return;
    }

    this.handleWebCorcFile(file, nameSplitted);
  }

  public confirm() {
    if (!this._accepted) return;
    this._projectService.addFile(
      this.config.data.parentURN,
      this.fileName,
      this._fileType,
    );
    if (this.config.data.parentURN === "/") {
      this.config.data.parentURN = "";
    }
    this._projectService.syncLocalFileContent(
      this.config.data.parentURN + this.fileName + "." + this._fileType,
      this._fileContent,
    );
  }

  public get accepted(): boolean {
    return this._accepted;
  }

  public get fileName(): string {
    return this._fileName;
  }

  public set fileName(name: string) {
    this._fileName = name;
  }

  public get fileType(): string {
    if (this._fileName == "" && this._fileType == "other") {
      return "";
    }
    return "." + this._fileType;
  }
}
