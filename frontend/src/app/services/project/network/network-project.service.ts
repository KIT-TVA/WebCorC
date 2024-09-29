import { Injectable, ɵdevModeEqual } from '@angular/core';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile } from '../../../types/project/inode';
import { CBCFormula } from '../CBCFormula';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NetworkProjectService {
  private static projects = "/projects"
  private static project = "/project"

  private projectId : string | undefined

  constructor() { }


  public async createProject(name : string) {

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
          this.projectId = data.id

      })
  }


  public getFileTree() : ApiDirectory {
    return new ApiDirectory("", [])
  }


  public createFile() {

  }

  public deleteFile() {

  }

  public getFileContent() :  ApiDiagrammFile | ApiTextFile {
    return new ApiDiagrammFile("", new CBCFormula())
  }

  public updateFileContent(file : ApiDiagrammFile | ApiTextFile) {

  }


  public createFolder() {

  }

  public deleteFolder() {

  }

}
