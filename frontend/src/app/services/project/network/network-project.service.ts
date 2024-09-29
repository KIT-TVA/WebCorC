import { Injectable } from '@angular/core';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile } from '../../../types/project/inode';
import { CBCFormula } from '../CBCFormula';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NetworkProjectService {
  private static projects = "/projects"

  constructor() { }


  public createProject(name : string) {
    console.log(name)

    fetch(environment.apiUrl + "/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name : name })
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
