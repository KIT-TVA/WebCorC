import { Injectable } from '@angular/core';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile, Inode } from '../types/api-elements';
import { CBCFormula, ICBCFormula } from '../CBCFormula';
import { ProjectElement } from '../types/project-elements';
import { CbcFormulaMapperService } from '../mapper/cbc-formula-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectStorageService {
  private static readonly projectIdKey = "projectId"
  private static readonly projectNameKey = "projectName"
  private static readonly projectFileTreeKey = "fileTree"
  private static readonly projectFileUrnPrefix = "_webCorc_"

  constructor(private mapper : CbcFormulaMapperService) { }


  public setProjectId(id : string) {
    sessionStorage.setItem(ProjectStorageService.projectIdKey, id)
  }

  public getProjectId() : string | null {
    return sessionStorage.getItem(ProjectStorageService.projectIdKey)
  }

  public setProjectName(name : string) {
    sessionStorage.setItem(ProjectStorageService.projectNameKey, name)
  }

  public getProjectName() : string | null {
    return sessionStorage.getItem(ProjectStorageService.projectNameKey)
  }

  public clear() {
    sessionStorage.clear()
  }


  public setProjectTree(root : ApiDirectory) {
    sessionStorage.setItem(ProjectStorageService.projectFileTreeKey, JSON.stringify(root))
  }

  public getProjectTree() : ApiDirectory | null {
    let storageContent = sessionStorage.getItem(ProjectStorageService.projectFileTreeKey)
    if (!storageContent) return null
    let root : ApiDirectory = JSON.parse(storageContent)
    return new ApiDirectory("", root.content)
  }

  public setFileContent(urn : string, content : string | CBCFormula) {
    if (content instanceof CBCFormula) {
      sessionStorage.setItem(ProjectStorageService.projectFileUrnPrefix + urn, JSON.stringify(content))
    } else {
      sessionStorage.setItem(ProjectStorageService.projectFileUrnPrefix + urn, content)
    }
  }

  public deleteFileContent(file : ProjectElement) {
    sessionStorage.removeItem(file.path)
  }

  public getFileContent(urn : string) : string | CBCFormula | null {
    let storageContent = sessionStorage.getItem(ProjectStorageService.projectFileUrnPrefix + urn)
    if (!storageContent) return null
    let splittedUrnByDot = urn.split(".")
    if (splittedUrnByDot[splittedUrnByDot.length - 1] == "diagram") {
      let formula =  JSON.parse(storageContent)
      return this.mapper.importFormula(formula)
    } 

    return storageContent
  }

  public isEmpty() : boolean {
    let countOfFilesInSessionStorage = 0
    for (let i = 0; i < sessionStorage.length; i++ ) {
      if (sessionStorage.key(i)?.startsWith(ProjectStorageService.projectFileUrnPrefix)) {
        countOfFilesInSessionStorage += 1
      }
    }

    return countOfFilesInSessionStorage == 0
  }
}
