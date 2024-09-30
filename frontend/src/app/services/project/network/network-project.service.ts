import { Injectable } from '@angular/core';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile, Inode } from '../../../types/project/inode';
import { CBCFormula } from '../CBCFormula';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { ConsoleService } from '../../console/console.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkProjectService {
  private static projects = "/projects"

  private _projectId : string | undefined
  private _dataChange = new BehaviorSubject<ApiDirectory>(new ApiDirectory("", []))
  private _finishedRequest = new Subject<void>()

  constructor(private consoleService : ConsoleService) { }


  public createProject(name : string) {

    const request = new Request(environment.apiUrl + NetworkProjectService.projects, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({name : name})
    })


    fetch(request)
      .then((response : Response) => response.json())
      .then((data) => {
          this._projectId = data.id
          this._finishedRequest.next()
      })
  }


  public readProject(projectId : string | undefined = this._projectId) {
    this._projectId = projectId

    const request = new Request(this.buildProjectURL(), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    })


    fetch(request)
      .then((response : Response) => response.json())
      .then((data) => this._dataChange.next(data.files))

  }


  public getFileTree() {
    const request = new Request(this.buildProjectURL(), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    })

    fetch(request)
      .then((response : Response) => response.json())
      .then((data) => this._dataChange.next(data))
  }


  public createFile(file : Inode) {
    const formData = new FormData()

    let realFile

    if (file instanceof ApiDiagrammFile) {
      realFile = new File([JSON.stringify(file)], this.removeLeadingSlashFromURN(file.urn), {
        type: "application/json"
      })
    } else {
      realFile = new File([(file as ApiTextFile).content], this.removeLeadingSlashFromURN(file.urn), {
        type: "text/plain"
      })
    }
    
    formData.append("fileUpload", realFile, this.removeLeadingSlashFromURN(file.urn))

    const request = new Request(this.buildFileURL(file.urn), {
      method: "POST",
      body: formData
    })
    
    fetch(request)
      .then((response : Response)=> response.json())
      .catch(() => {
        this.consoleService.ttyChange.next("Uploading file " + file.urn + " failed")
      })
  }

  public deleteFile() {

  }

  public getFileContent() :  ApiDiagrammFile | ApiTextFile {
    return new ApiDiagrammFile("", new CBCFormula())
  }

  public uploadFileContent(file : ApiDiagrammFile | ApiTextFile) {
    const request = new Request(this.buildProjectURL(), {
      method: "POST"
    })
  }


  public createFolder() {

  }

  public deleteFolder() {

  }

  private buildProjectURL() : string {
    return environment.apiUrl + NetworkProjectService.projects + "/" + this.projectId 
  }

  private buildFileURL(urn : string) : string {
    return this.buildProjectURL() + "/files/" + encodeURIComponent(urn.substring(1))
  }

  private removeLeadingSlashFromURN(urn : string) : string {
    return urn.substring(1)
  }


  get projectId() {
    return this._projectId
  }

  get dataChange() {
    return this._dataChange
  }

  get requestFinished() {
    return this._finishedRequest
  }

}
