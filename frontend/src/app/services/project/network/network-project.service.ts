import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { ConsoleService } from '../../console/console.service';
import { CBCFormula } from '../CBCFormula';
import { HttpClient } from '@angular/common/http';
import { NetProject } from './NetProject';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile, Inode } from '../types/api-elements';

/**
 * Service to interact with the backend for managing the project.
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkProjectService {
  private static projects = "/projects"

  private _projectId : string | undefined
  private _projectname : string | undefined
  private  _dataChange = new BehaviorSubject<ApiDirectory>(new ApiDirectory("", []))
  private _finishedRequest = new Subject<void>()

  constructor(private http : HttpClient, private consoleService : ConsoleService) { }


  /**
   * Create a new project 
   * @param name The name of the project, should not be empty
   */
  public createProject(name : string) {

    if (!name) return

    this.http
      .post<NetProject>(environment.apiUrl + NetworkProjectService.projects, { name: name })
      .subscribe(project => {
        this.projectId = project.id
        this._finishedRequest.next()
      })
  }

  /**
   * Read the project from the backend based on its id
   * @param projectId The project id of the project to read from the backend
   */
  public readProject(projectId : string | undefined = this._projectId) {
    this._projectId = projectId

    this.http
      .get<NetProject>(this.buildProjectURL())
      .subscribe(project => {
        this._projectname = project.name
        console.log(new ApiDirectory(project.files.urn, project.files.content))
        this._dataChange.next(new ApiDirectory(project.files.urn, project.files.content))
      })
  }


  /**
   * Upload the given file to the backend
   * @param file The file to upload
   */
  public uploadFile(file : Inode) {
    const formData = new FormData()

    const urn = file.urn 

    let realFile

    if (file instanceof ApiDiagrammFile) {
      realFile = new File([JSON.stringify(file.content)], urn, {
        type: "application/json"
      })
    } else {
      realFile = new File([(file as ApiTextFile).content], urn, {
        type: "text/plain"
      })
    }
    
    formData.append("fileUpload", realFile, urn)

    this.http.post(this.buildFileURL(urn), formData)
      .subscribe(() => {})
    
  }

  public deleteFile() {

  }

  /**
   * Get the content of the file from the backend.
   * Caution: Not fully implemented
   * @param urn 
   */
  public async getFileContent(urn : string) :  Promise<string | CBCFormula> {

    const request = new Request(this.buildFileURL(urn), {
      method : "GET"
    })

    return await fetch(request)
      .then((response : Response) => response.blob())
      .then(async (blob) => {
        let file : string | CBCFormula
        if (blob.type === "application/json") {
          file = JSON.parse(await blob.text())
        } else {
          file = await blob.text()
        }
        return file
      }).then((file) => {
        if ( typeof file === "string") {
          return file
        }

    
        const formula = new CBCFormula(
          file.type,
          file.name,
          file.proven,
          file.comment,
          file.compositionTechnique,
          file.className,
          file.methodName,
          file.javaVariables,
          file.globalConditions,
          file.preCondition,
          file.postCondition,
          file.statement
        )

        formula.import()
        return formula
      })

  }

  private buildProjectURL() : string {
    return environment.apiUrl + NetworkProjectService.projects + "/" + this.projectId 
  }

  private buildFileURL(urn : string) : string {
    return this.buildProjectURL() + "/files/" + encodeURIComponent(urn)
  }


  get projectId() {
    return this._projectId
  }

  get projectName() {
    return this._projectname
  }

  set projectId(value : string | undefined) {
    this._projectId = value
  }

  get dataChange() {
    return this._dataChange
  }

  get requestFinished() {
    return this._finishedRequest
  }

}
