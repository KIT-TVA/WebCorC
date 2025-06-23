import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, Subject, catchError, of } from 'rxjs';
import { ConsoleService } from '../../console/console.service';
import { CBCFormula, ICBCFormula } from '../../../types/CBCFormula';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NetProject } from './NetProject';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile, Inode } from '../types/api-elements';
import { CbcFormulaMapperService } from '../mapper/cbc-formula-mapper.service';
import { NetworkStatusService } from '../../networkStatus/network-status.service';
import { ProjectStorageService } from '../storage/project-storage.service';

/**
 * Service to interact with the backend for managing the project via hhtp rest calls.
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

  constructor(private http : HttpClient,
    private mapper : CbcFormulaMapperService,
    private consoleService : ConsoleService,
    private networkStatusService : NetworkStatusService,
    private storage : ProjectStorageService
  ) { }


  /**
   * Create a new project 
   * @param name The name of the project, should not be empty
   */
  public createProject(name : string) {

    if (!name) return
    
    this.networkStatusService.startNetworkRequest()
    this.http
      .post<NetProject>(environment.apiUrl + NetworkProjectService.projects, { name: name })
      .pipe(catchError((error : HttpErrorResponse) : Observable<NetProject> => {
        this.consoleService.addErrorResponse(error, "Creating Project")
        this.networkStatusService.stopNetworkRequest()
        return of()
      }))
      .subscribe(project => {
        this.projectId = project.id
        this._finishedRequest.next()
        this.networkStatusService.stopNetworkRequest()
      })
  }

  /**
   * Read the project from the backend based on its id
   * @param projectId The project id of the project to read from the backend
   */
  public readProject(projectId : string | undefined = this._projectId) {
    this._projectId = projectId

    this.networkStatusService.startNetworkRequest()

    this.http
      .get<NetProject>(this.buildProjectURL())
      .pipe(catchError((error : HttpErrorResponse) : Observable<NetProject> => {
        this.consoleService.addErrorResponse(error, "Reading Project")
        this.networkStatusService.stopNetworkRequest()
        return of()
      }))
      .subscribe(project => {
        this._projectname = project.name
        this._dataChange.next(new ApiDirectory(project.files.urn, project.files.content))
        this.networkStatusService.stopNetworkRequest()
        this.storage.setProjectTree(new ApiDirectory(project.files.urn, project.files.content))
      })
  }


  /**
   * Upload the given file to the backend
   * @param file The file to upload
   */
  public uploadFile(file : Inode) {
    this.networkStatusService.startNetworkRequest()
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
      .pipe(catchError((error : HttpErrorResponse) : Observable<void> => {
        this.consoleService.addErrorResponse(error, "Uploading file " + file.urn)
        this.networkStatusService.stopNetworkRequest()
        return of()
      }))
      .subscribe(() => this.networkStatusService.stopNetworkRequest())
    
  }

  /**
   * Delete the given file in the backend 
   * @param file The file to delete
   */
  public deleteFile(file : Inode) {
    this.http.delete(this.buildFileURL(file.urn))
      .pipe(catchError((error : HttpErrorResponse) : Observable<void> => {
        this.consoleService.addErrorResponse(error, "Deleting file " + file.urn)
        this.networkStatusService.stopNetworkRequest()
        return of()
      }))
      .subscribe(() => this.networkStatusService.startNetworkRequest())
  }

  /**
   * Get the content of the file from the backend.
   * Caution: Not fully implemented
   * @param urn 
   */
  public async getFileContent(urn : string) :  Promise<string | CBCFormula> {
    this.networkStatusService.startNetworkRequest()
    const request = new Request(this.buildFileURL(urn), {
      method : "GET"
    })

    return await fetch(request)
      .then((response : Response) => response.blob())
      .then(async (blob) => {
        let file : string | ICBCFormula
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

        this.networkStatusService.stopNetworkRequest()
        return this.mapper.importFormula(file)
      })

  }

  private buildProjectURL() : string {
    return environment.apiUrl + NetworkProjectService.projects + "/" + this.projectId 
  }

  private buildFileURL(urn : string) : string {
    return this.buildProjectURL() + "/files/" + encodeURIComponent(urn)
  }


  public get projectId() {
    return this._projectId
  }

  public get projectName() {
    return this._projectname
  }

  public set projectId(value : string | undefined) {
    this._projectId = value
  }

  public get dataChange() {
    return this._dataChange
  }

  public get requestFinished() {
    return this._finishedRequest
  }

}
