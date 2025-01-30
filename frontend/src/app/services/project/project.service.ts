import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, first} from 'rxjs';
import { CBCFormula } from './CBCFormula';
import { NetworkProjectService } from './network/network-project.service';
import { CodeFile, DiagramFile, ProjectDirectory, ProjectElement } from './types/project-elements';
import { ProjectElementsMapperService } from './types/project-elements-mapper.service';
import { ProjectStorageService } from './storage/project-storage.service';
import { ApiDirectory } from './types/api-elements';

/**
 * Service for project managment.
 * This service is the single point of truth for the file tree and file content in the project
 * Used by all components, which interact with the file tree or the content of the files
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private _rootDir = new ProjectDirectory("","")
  private _dataChange = new BehaviorSubject<ProjectElement[]>(this._rootDir.content)
  private _saveNotify = new Subject<void>()
  private _savedFinished = new Subject<void>()
  private _movedHistory = new Map<string, string>()
  private _projectname: string = ""

  constructor(
    private network : NetworkProjectService,
    private mapper : ProjectElementsMapperService,
    private storage : ProjectStorageService) {

    const projectIdFromStorage = storage.getProjectId()
    
    if (projectIdFromStorage) {
      this.network.projectId = projectIdFromStorage
      const nameFromStorage = storage.getProjectName()
      this.projectname= nameFromStorage ? nameFromStorage : ""
    }

    this.network.dataChange.subscribe((rootDir) => {
      this._rootDir = mapper.importDirectory(rootDir)
      this._projectname = network.projectName ? network.projectName : ""
      this._dataChange.next(this._rootDir.content)
    })
  }

  /**
   * Search for a element of the project by its path recursiv
   * @param path The path of the element to retrieve
   * @param directory The directory to search for, default: root 
   * @returns The file identified by the given path, if no matching file is found null
   * @see ProjectElement
   */
  public findByPath(path : string, directory : ProjectDirectory = this._rootDir) : ProjectElement | null {
    if (directory.path === path) {
      return directory
    }

    for (const child of directory.content) {

      if (child.path === path) { return child; }

      if (child instanceof ProjectDirectory) {
        const relativePath = path.replace(child.path, '')

        if (relativePath.length < path.length && relativePath.length > 0) {
          return this.findByPath(path, child);
        }
      }
    }

    return null;
  }


  /**
   * Add a directory to the file tree,
   * Todo: Make errors visible to Enduser,
   * Sideeffect: triggers refresh of the file tree via subject
   * Sideeffect: Removes the input for the directory name
   * @param parentPath The direct parent to add the directory under
   * @param name The name of the directory, which is unique within the parentdirectory
   * @returns The parent directory of the newly created directory
   */
  public addDirectory(parentPath : string, name : string) : ProjectDirectory {
    const parentDir = this.findByPath(parentPath);
    if (!parentDir) {
      throw new Error("Parent dir of new dir not found");
    }

    const dir = parentDir as ProjectDirectory

    let relativePath = parentPath
    if (parentPath.startsWith("/")) {
      relativePath = parentPath.substring(1)
    }

    dir.removeElement(this.mapper.fakeElementName)

    const newDir = new ProjectDirectory(relativePath, name);
    if (!dir.addElement(newDir)) {
      throw new Error("Could not add directory, maybe you tried to create a duplicate?")
    }

    this._dataChange.next(this._rootDir.content)
    this.storage.setProjectTree(this.mapper.exportTree(this._rootDir))
    return dir;
  }

  /**
   * Add a file to the file tree.
   * Sideeffect: triggers refresh of file tree
   * Sideeffect: removes the input for the file name
   * @param parentPath The path of the direct parent to add the file under
   * @param name The name of the file
   * @param type The type of the file (java|diagram)
   * @returns The parent directory of the newly created file
   */
  public addFile(parentPath : string, name : string, type: string) : ProjectDirectory { 
    const parentDir = this.findByPath(parentPath);
    if (!parentDir) {
      throw new Error("Parent dir of new file not found")
    }

    const dir = parentDir as ProjectDirectory
    let relativePath = parentPath
    if (parentPath.startsWith("/")) {
      relativePath = parentPath.substring(1)
    }

    dir.removeElement(this.mapper.fakeElementName)

    let newFile = null 

    switch (type) {
      case "java" : newFile = this.mapper.constructCodeFile(relativePath, name, type); break;
      case "diagram" : newFile = this.mapper.constructDiagramFile(relativePath, name, type); break;
      case "key" : newFile = this.mapper.constructCodeFile(relativePath, name, type); break;
      default: throw new Error("Could not add file, unknown type")
    }
    
    if (!dir.addElement(newFile)) {
      throw new Error("Could not add file, maybe you tried to create a duplicate?")
    }

    this.storage.setProjectTree(this.mapper.exportTree(this._rootDir))
    this._dataChange.next(this._rootDir.content)
    return dir;
  }

  /**
   * Add the fake project element to the file tree, to allow the user to edit the name of the element to be created
   * The fake project element gets removed in the calls @see ProjectService.addDirectory @see ProjectService.addFile
   * @param path The path under which the element should be created
   */
  public addFakeElement(path : string) {
    const parentDir = this.findByPath(path);
    if (!parentDir) {
      throw new Error("Parent dir of new element not found")
    }

    const dir = parentDir as ProjectDirectory;
    const newElement = this.mapper.constructFakeElement(path);
    if (!dir.addElement(newElement)) {
      throw new Error("Could not add fake element")
    }
    
    this._dataChange.next(this._rootDir.content)
  }

  /**
   * Delete a project element from the tree
   * @param path The path of the parent
   * @param name The name of the element
   */
  public deleteElement(path : string, name : string) {
    let parentDirPath = path.replace(name, '')
    if (parentDirPath === '') {
      parentDirPath = '/'
     }

    if (parentDirPath.endsWith('//')) {
      parentDirPath = parentDirPath.slice(0, parentDirPath.length - 1)
    }

    const parentDir = this.findByPath(parentDirPath)
    const elementToDelete = this.findByPath(path)

    if (!parentDir) {
      throw new Error("Parent dir of element to delete not found")
    }

    if (!elementToDelete) {
      throw new Error("Element not found")
    }

    let inode = this.mapper.exportFile(elementToDelete)
    if (elementToDelete instanceof ProjectDirectory) {
      inode = this.mapper.exportDirectory(elementToDelete)
    }

    if (this._projectname && name !== this.fakeElementName) {
      this.network.deleteFile(inode)
    }

    const dir = parentDir as ProjectDirectory
    dir.removeElement(name);
    this._dataChange.next(this._rootDir.content)
    this.storage.setProjectTree(this.mapper.exportTree(this._rootDir))
  }

  /**
   * Saves the current state of the editor into the file tree
   * @param urn The Path of the file to save the content in
   * @param content The content to save in the file identified by the urn
   */
  public syncFileContent(urn : string, content : string | CBCFormula) {
    let file = this.findByPath(urn)
    if (!file) {
      const historyEntry = this._movedHistory.get(urn)

      if (!historyEntry) {
        throw new Error("File not found")
      }

      file = this.findByPath(historyEntry)

      if (!file) {
        throw new Error("File not found")
      }

      this._movedHistory.delete(historyEntry)
    }

    const oldcontent = file.content
    file.content = content
    if (oldcontent != file.content) {
      this.storage.setFileContent(urn, content)
    }

    this._savedFinished.next()
  }

  /**
   * Read the content of the file with the given urn
   * @param urn The path of the file to read the content from
   * @returns The content of the file
   */
  public async getFileContent(urn : string) : Promise<string | CBCFormula> {
    let file = this.findByPath(urn)
    if (!file) {
      const rootDir = this.storage.getProjectTree()
      if (!rootDir) {
        throw new Error("Empty session storage: File not found")
      }

      this._rootDir = this.mapper.importDirectory(rootDir)
      this.dataChange.next(this._rootDir.content)
      file = this.findByPath(urn)
      if (!file) {
        throw new Error("File not found")
      }
    }

    let needstoBeFetched = false

    if (file.content instanceof CBCFormula) {
      needstoBeFetched = (file.content as CBCFormula).statement === undefined
    } else {
      needstoBeFetched = file.content === ""
    }

    let content : string | CBCFormula | null = (file as CodeFile).content

    // if file content is default value and projectId is set
    if (this.projectId && needstoBeFetched) {
      content = this.storage.getFileContent(urn)
      if (!content) {
        content = await this.network.getFileContent(urn)
      }
    }

    // if no projectId is set try to 
    if (!this.projectId && needstoBeFetched) {
      const contentFromStorage = this.storage.getFileContent(urn)
      if (contentFromStorage) {
        content = contentFromStorage
      }
    }

    return content
  }

  /**
   * Export the project by exporting the root directory to the data only classes
   * @returns 
   */
  public export() {
    return this.mapper.exportDirectory(this._rootDir)
  }

  public import(rootDir : ApiDirectory, projectname : string) {
    this._rootDir = this.mapper.importProject(rootDir)
    this._projectname = projectname
    this._dataChange.next(this._rootDir.content)
    this.storage.import(this.mapper.exportDirectory(this._rootDir), projectname)
  }

  public uploadWorkspace(wait : boolean = false) {
    if (!wait) {
      this._savedFinished
        .pipe(first())
        .subscribe(() => this.uploadFolder(this._rootDir))
        
      this._saveNotify.next()
      
      return
    }

    this.network.requestFinished
      .pipe(first())
      .subscribe(() => this.uploadFolder(this._rootDir))

    this.editorNotify.next()
    this.storage.clear()
  }


  private uploadFolder(folder : ProjectDirectory) {
    for (const item of folder.content) {
      if (item instanceof ProjectDirectory) {
        this.uploadFolder(item)
        continue
      }
      
      if (item instanceof DiagramFile && item.content.statement !== undefined) {
        this.network.uploadFile(this.mapper.exportFile(item))
        continue
      }

      if (item instanceof CodeFile && item.content !== "") {
        this.network.uploadFile(this.mapper.exportFile(item))
      }
    }
  }


  public get shouldCreateProject() : boolean {
    return this.network.projectId === undefined
  }


  public createProject() {
    this.network.requestFinished.pipe(first()).subscribe(() => {
      if (!this.network.projectId) return
      this.storage.setProjectId(this.network.projectId)
    })

    this.network.createProject(this._projectname)
  }


  public downloadWorkspace() {


    if (this.storage.getProjectId() === this.network.projectId) {
      const projectTree = this.storage.getProjectTree()
      if (!projectTree) return
      this._rootDir = this.mapper.importDirectory(projectTree)

      const projectName = this.storage.getProjectName()
      if (!projectName) return
      this._projectname = projectName

      return
    } else {
      //Todo: Create dialog asking for allowance to evict local staging differences
    }


    // if the project id is not defined in storage configure a observer, to save the id to storage
    if (!this.storage.getProjectId()) {
      this.network.dataChange.pipe(first()).subscribe(() => {
        if (!this.network.projectId) return
        this.storage.setProjectId(this.network.projectId)
      }) 
    }

    this.network.readProject()
  }

  public moveElement(file : ProjectElement, target : ProjectElement) {
    let oldPath = file.path
    let oldParentPath = file.path.substring(0, file.path.lastIndexOf('/') + 1)
    const newParentPath = target.path.substring(0, target.path.lastIndexOf('/') + 1)

    console.log(this._rootDir)

    console.log(oldParentPath)

    if (oldParentPath != newParentPath) {
      this.deleteElement(oldPath, file.name)
    }

    if (target instanceof ProjectDirectory) {
      file.move(target)
    } else {
      const parentTarget = this.findByPath(newParentPath)
      file.move(parentTarget as ProjectDirectory) 
    }


    this._movedHistory.set(oldPath, file.path)

    this._dataChange.next(this._rootDir.content)
  }

  public notifyEditortoSave() {
    this._saveNotify.next()
  }

  public get editorNotify() {
    return this._saveNotify
  }

  public get explorerNotify() {
    return this._savedFinished
  }

  public get root() { 
    return this._rootDir
  }

  public get dataChange() {
    return this._dataChange
  }

  public get isEmpty() : boolean {
    return this._rootDir.content.length == 0 || this.storage.isEmpty()
  }

  public get projectname(): string {
    return this._projectname;
  }


  public set projectname(value: string) {
    this._projectname = value;
  }

  public set projectId(value : string) {
    this.network.projectId = value
  }

  public get projectId() : string | undefined {
    return this.network.projectId
  }

  public get fakeElementName() {
    return this.mapper.fakeElementName
  }

  public get requestFinished() {
    return this.network.requestFinished
  }

}
