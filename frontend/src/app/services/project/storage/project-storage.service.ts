import { Injectable } from '@angular/core';
import { ApiDiagrammFile, ApiDirectory, ApiTextFile } from '../types/api-elements';
import { CBCFormula } from '../CBCFormula';
import { ProjectElement } from '../types/project-elements';
import { CbcFormulaMapperService } from '../mapper/cbc-formula-mapper.service';

/**
 * Service to persist the project content in the session storage.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectStorageService {
  private static readonly projectIdKey = "projectId"
  private static readonly projectNameKey = "projectName"
  private static readonly projectFileTreeKey = "fileTree"
  private static readonly projectFileUrnPrefix = "_webCorc_"

  constructor(private mapper : CbcFormulaMapperService) { }

  /**
   * Set the project id in the session storage
   * @param id 
   */
  public setProjectId(id : string) {
    sessionStorage.setItem(ProjectStorageService.projectIdKey, id)
  }

  /**
   * Get the project id from the session storage
   * @returns 
   */
  public getProjectId() : string | null {
    return sessionStorage.getItem(ProjectStorageService.projectIdKey)
  }

  /**
   * Set the project name in the session storage 
   * @param name 
   */
  public setProjectName(name : string) {
    sessionStorage.setItem(ProjectStorageService.projectNameKey, name)
  }

  /**
   * Get the project name from the session storage
   * @returns 
   */
  public getProjectName() : string | null {
    return sessionStorage.getItem(ProjectStorageService.projectNameKey)
  }

  /**
   * Remove all session storage content
   */
  public clear() {
    for (let i = 0; i < sessionStorage.length; i++ ) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(ProjectStorageService.projectFileUrnPrefix)) {
        sessionStorage.removeItem(key)
      }
    }
  }

  /**
   * Set a slim version of the api directory to persist the folder structure
   * @param root the root directory to persist to session storage
   */
  public setProjectTree(root : ApiDirectory) {
    sessionStorage.setItem(ProjectStorageService.projectFileTreeKey, JSON.stringify(root))
  }

  public import(root : ApiDirectory, projectname : string) {
    this.setProjectName(projectname)
    this.setProjectTree(root)
    this.importFileContent(root)
  }
  /**
   * Get the slim version of the project tree to get the folder structure after a refresh
   * @returns The project tree without the file contents
   */
  public getProjectTree() : ApiDirectory | null {
    const storageContent = sessionStorage.getItem(ProjectStorageService.projectFileTreeKey)
    if (!storageContent) return null
    const root : ApiDirectory = JSON.parse(storageContent)
    return this.fixDirectoryNames(new ApiDirectory("", root.content))
  }

  /**
   * Save the file content to session storage
   * @param urn The file urn
   * @param content The content of the file
   */
  public setFileContent(urn : string, content : string | CBCFormula) {
    if (content instanceof CBCFormula) {
      sessionStorage.setItem(ProjectStorageService.projectFileUrnPrefix + urn, JSON.stringify(content))
    } else {
      sessionStorage.setItem(ProjectStorageService.projectFileUrnPrefix + urn, content)
    }
  }

  /**
   * Delete the file content under the file urn
   * @param file the file to remove from the session storage
   */
  public deleteFileContent(file : ProjectElement | null) {
    sessionStorage.removeItem(ProjectStorageService.projectFileUrnPrefix + file?.path)
  }

  /**
   * Delete the file content under the passed path from session storage
   * @param path The path of the file to delete from session storage
   */
  public deleteFileContentByPath(path : string) {
    sessionStorage.removeItem(ProjectStorageService.projectFileTreeKey + path)
  }

  /**
   * Get the file content by the urn of the file from session storage
   * @param urn The urn of the file to get the content from session storage
   * @returns The content of the file, if no file with the urn is in session storage null.
   */
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

  /**
   * Check for session storage for empty state
   * @returns true -> session storage is empty, else false 
   */
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

  private fixDirectoryNames(directory : ApiDirectory) {
    for (const child of directory.content) {
      if (child.inodeType === "directory") {
        child.urn = child.urn.substring(0, child.urn.length - 1)
      }
    }

    return directory
  }


}
