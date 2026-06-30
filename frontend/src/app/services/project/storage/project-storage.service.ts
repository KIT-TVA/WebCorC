import { Injectable } from "@angular/core";
import { LocalCBCFormula } from "../../../types/CBCFormula";
import { IProjectElement, ProjectDirectory } from "../types/project-elements";
import { CbcFormulaMapperService } from "../mapper/cbc-formula-mapper.service";
import { ProjectPredicate } from "../../../types/ProjectPredicate";
import { ProjectElementsMapperService } from "../types/project-elements-mapper.service";

/**
 * Service to persist the project content in the session storage.
 */
@Injectable({
  providedIn: "root",
})
export class ProjectStorageService {
  private static readonly projectIdKey = "projectId";
  private static readonly projectNameKey = "projectName";
  private static readonly projectFileTreeKey = "fileTree";
  private static readonly remoteFileTreeKey = "remoteFileTree";
  private static readonly projectFileUrnPrefix = "_webCorc_";
  private static readonly projectPredicatesKey = "predicates";

  constructor(
    private mapper: CbcFormulaMapperService,
    private projectElementsMapperService: ProjectElementsMapperService,
  ) {}

  /**
   * Set the project id in the session storage
   * @param id
   */
  public setProjectId(id: string) {
    sessionStorage.setItem(ProjectStorageService.projectIdKey, id);
  }

  /**
   * Get the project id from the session storage
   * @returns
   */
  public getProjectId(): string | null {
    return sessionStorage.getItem(ProjectStorageService.projectIdKey);
  }

  /**
   * Set the project name in the session storage
   * @param name
   */
  public setProjectName(name: string) {
    sessionStorage.setItem(ProjectStorageService.projectNameKey, name);
  }

  /**
   * Get the project name from the session storage
   * @returns
   */
  public getProjectName(): string | null {
    return sessionStorage.getItem(ProjectStorageService.projectNameKey);
  }

  /**
   * Remove all session storage content
   */
  public clear() {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(ProjectStorageService.projectFileUrnPrefix)) {
        sessionStorage.removeItem(key);
      }
    }
  }

  public saveProject(root: ProjectDirectory, projectname: string) {
    this.setProjectName(projectname);
    sessionStorage.setItem(
      ProjectStorageService.projectFileTreeKey,
      JSON.stringify(root),
    );
  }

  public saveRemoteProject(root: ProjectDirectory, projectname: string) {
    this.setProjectName(projectname);
    sessionStorage.setItem(
      ProjectStorageService.remoteFileTreeKey,
      JSON.stringify(root),
    );
  }

  /**
   * Get the slim version of the project tree to get the folder structure after a refresh
   * @returns The project tree without the file contents
   */
  public getProjectTree(): ProjectDirectory | null {
    const storageContent = sessionStorage.getItem(
      ProjectStorageService.projectFileTreeKey,
    );
    if (!storageContent) return null;
    const iProjectElement: IProjectElement = JSON.parse(storageContent);
    console.log(iProjectElement);
    return this.projectElementsMapperService.parseProjectTree(iProjectElement);
  }

  public getRemoteProjectTree(): ProjectDirectory | null {
    const storageContent = sessionStorage.getItem(
      ProjectStorageService.remoteFileTreeKey,
    );
    if (!storageContent) return null;
    const iProjectElement: IProjectElement = JSON.parse(storageContent);
    console.log(iProjectElement);
    return this.projectElementsMapperService.parseProjectTree(iProjectElement);
  }

  public getPredicates(): ProjectPredicate[] {
    const storageContent = sessionStorage.getItem(
      ProjectStorageService.projectPredicatesKey,
    );
    if (!storageContent) return [];
    return JSON.parse(storageContent);
  }

  public setPredicates(predicates: ProjectPredicate[]) {
    sessionStorage.setItem(
      ProjectStorageService.projectPredicatesKey,
      JSON.stringify(predicates),
    );
  }
}
