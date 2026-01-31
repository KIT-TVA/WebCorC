import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { firstValueFrom, Subject } from "rxjs";
import { ConsoleService } from "../../console/console.service";
import { ICBCFormula, LocalCBCFormula } from "../../../types/CBCFormula";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { NetProject } from "./NetProject";
import {
  ApiDiagramFile,
  ApiDirectory,
  ApiTextFile,
  fixUrns,
  Inode,
  LocalDirectory,
} from "../types/api-elements";
import { CbcFormulaMapperService } from "../mapper/cbc-formula-mapper.service";
import { ProjectStorageService } from "../storage/project-storage.service";
import { ProjectElementsMapperService } from "../types/project-elements-mapper.service";

/**
 * Service to interact with the backend for managing the project via hhtp rest calls.
 */
@Injectable({
  providedIn: "root",
})
export class NetworkProjectService {
  private static projects = "/projects";
  private _projectname: string | undefined;
  private _finishedRequest = new Subject<void>();

  constructor(
    private http: HttpClient,
    private mapper: CbcFormulaMapperService,
    private projectMapper: ProjectElementsMapperService,
    private consoleService: ConsoleService,
    private storage: ProjectStorageService,
  ) {}

  private _projectId: string | undefined;

  public get projectId() {
    return this._projectId;
  }

  public set projectId(value: string | undefined) {
    this._projectId = value;
  }

  public get projectName() {
    return this._projectname;
  }

  public get requestFinished() {
    return this._finishedRequest;
  }

  /**
   * Create a new project
   * @param name The name of the project, should not be empty
   */
  public async createProject(name: string) {
    if (!name) return;

    try {
      const project = await firstValueFrom(
        this.http.post<NetProject>(
          environment.apiUrl + NetworkProjectService.projects,
          {
            name: name,
          },
        ),
      );
      this.projectId = project.id;
      this._finishedRequest.next();
    } catch (error) {
      this.consoleService.addErrorResponse(
        error as HttpErrorResponse,
        "Creating Project",
      );
      throw error;
    }
  }

  /**
   * Read the project from the backend based on its id
   * @param projectId The project id of the project to read from the backend
   */
  public async readProject(projectId: string | undefined = this._projectId) {
    this._projectId = projectId;

    try {
      const project = await firstValueFrom(
        this.http.get<NetProject>(this.buildProjectURL()),
      );
      this._projectname = project.name;
      this._projectId = project.id;
      const apiDirectory = new ApiDirectory(
        project.files.urn,
        project.files.content,
      );
      this.storage.saveProject(
        this.projectMapper.importProject(
          fixUrns(LocalDirectory.fromApi(apiDirectory)) as LocalDirectory,
        ),
        project.name,
      );
      this.storage.setProjectId(project.id);
    } catch (error) {
      this.consoleService.addErrorResponse(
        error as HttpErrorResponse,
        "Reading Project",
      );
      throw error;
    }
  }

  /**
   * Upload the given file to the backend
   * @param file The file to upload
   */
  public async uploadFile(file: Inode) {
    const formData = new FormData();

    const urn = file.urn;

    let realFile;

    if (file instanceof ApiDiagramFile) {
      realFile = new File([JSON.stringify(file.content)], urn, {
        type: "application/json",
      });
    } else {
      realFile = new File([(file as ApiTextFile).content], urn, {
        type: "text/plain",
      });
    }

    formData.append("fileUpload", realFile, urn);

    try {
      await firstValueFrom(this.http.post(this.buildFileURL(urn), formData));
    } catch (error) {
      this.consoleService.addErrorResponse(
        error as HttpErrorResponse,
        "Uploading file " + file.urn,
      );
    }
  }

  /**
   * Delete the given file in the backend
   * @param file The file to delete
   */
  public async deleteFile(file: Inode) {
    try {
      await firstValueFrom(this.http.delete(this.buildFileURL(file.urn)));
    } catch (error) {
      this.consoleService.addErrorResponse(
        error as HttpErrorResponse,
        "Deleting file " + file.urn,
      );
    }
  }

  /**
   * Get the content of the file from the backend.
   * Caution: Not fully implemented
   * @param urn
   */
  public async getFileContent(urn: string): Promise<string | LocalCBCFormula> {
    const request = new Request(this.buildFileURL(urn), {
      method: "GET",
    });

    return await fetch(request)
      .then((response: Response) => response.blob())
      .then(async (blob) => {
        let file: string | ICBCFormula;
        if (blob.type === "application/json") {
          file = JSON.parse(await blob.text());
        } else {
          file = await blob.text();
        }
        return file;
      })
      .then((file) => {
        if (typeof file === "string") {
          return file;
        }

        return this.mapper.importFormula(file);
      });
  }

  private buildProjectURL(): string {
    return (
      environment.apiUrl + NetworkProjectService.projects + "/" + this.projectId
    );
  }

  private buildFileURL(urn: string): string {
    return this.buildProjectURL() + "/files/" + encodeURIComponent(urn);
  }
}
