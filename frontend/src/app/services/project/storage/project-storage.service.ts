import { Injectable } from '@angular/core';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile } from '../types/api-elements';
import { CBCFormula } from '../CBCFormula';
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

  private fixDirectoryNames(directory : ApiDirectory) {
    for (const child of directory.content) {
      if (child.inodeType === "directory") {
        child.urn = child.urn.substring(0, child.urn.length - 1)
      }
    }

    return directory
  }

  public getProjectTree() : ApiDirectory | null {
    const storageContent = sessionStorage.getItem(ProjectStorageService.projectFileTreeKey)
    if (!storageContent) return null
    const root : ApiDirectory = JSON.parse(storageContent)
    return this.fixDirectoryNames(new ApiDirectory("", root.content))
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
    const storageContent = sessionStorage.getItem(ProjectStorageService.projectFileUrnPrefix + urn)
    if (!storageContent) return null
    const splittedUrnByDot = urn.split(".")
    if (splittedUrnByDot[splittedUrnByDot.length - 1] == "diagram") {
      const formula = JSON.parse(storageContent)
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

    return countOfFilesInSessionStorage <= 0
  }

  private importFileContent(directory : ApiDirectory) {
    for (const child of directory.content) {
      if (child instanceof ApiDirectory) {
        this.importFileContent((child as ApiDirectory))
      } else {
        if (child instanceof ApiDiagrammFile) {
          this.setFileContent(child.urn, (child as ApiDiagrammFile).content)
        } else if (child instanceof ApiTextFile) {
          this.setFileContent(child.urn, (child as ApiTextFile).content)
        }
      }
    }
  }

  public import(root : ApiDirectory, projectname : string) {
    this.setProjectName(projectname)
    this.setProjectTree(root)
    this.importFileContent(root)
  }
}
