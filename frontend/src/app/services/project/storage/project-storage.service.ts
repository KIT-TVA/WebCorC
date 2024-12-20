import { Injectable } from '@angular/core';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile, Inode } from '../types/api-elements';
import { CBCFormula, ICBCFormula } from '../CBCFormula';
import { ProjectElement } from '../types/project-elements';
import { CbcFormulaMapperService } from '../mapper/cbc-formula-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectStorageService {

  constructor(private mapper : CbcFormulaMapperService) { }


  public setProjectId(id : string) {
    sessionStorage.setItem("projectId", id)
  }

  public getProjectId() : string | null {
    return sessionStorage.getItem("projectId")
  }

  public setProjectName(name : string) {
    sessionStorage.setItem("projectName", name)
  }

  public getProjectName() : string | null {
    return sessionStorage.getItem("projectName")
  }

  public clear() {
    sessionStorage.clear()
  }


  public setProjectTree(root : ApiDirectory) {
    sessionStorage.setItem("root", JSON.stringify(root))
  }

  public getProjectTree() : ApiDirectory | null {
    let storageContent = sessionStorage.getItem("root")
    if (!storageContent) return null
    let root : ApiDirectory = JSON.parse(storageContent)
    return new ApiDirectory("", root.content)
  }

  public setFileContent(urn : string, content : string | CBCFormula) {
    if (content instanceof CBCFormula) {
      sessionStorage.setItem(urn, JSON.stringify(content))
    } else {
      sessionStorage.setItem(urn, content)
    }
  }

  public deleteFileContent(file : ProjectElement) {
    sessionStorage.removeItem(file.path)
  }

  public getFileContent(urn : string) : string | CBCFormula | null {
    let storageContent = sessionStorage.getItem(urn)
    if (!storageContent) return null
    let splittedUrnByDot = urn.split(".")
    if (splittedUrnByDot[splittedUrnByDot.length - 1] == "diagram") {
      let formula =  JSON.parse(storageContent)
      return this.mapper.importFormula(formula)
    } 

    return storageContent
  }
}
