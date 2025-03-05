import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, first} from 'rxjs';
import { CBCFormula } from './CBCFormula';
import { NetworkProjectService } from './network/network-project.service';
import { CodeFile, DiagramFile, ProjectDirectory, ProjectElement, ProjectFile, RenameProjectElement } from './types/project-elements';
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

    const projectFileTree = storage.getProjectTree()

    if (projectFileTree) {
      this._rootDir = mapper.importDirectory(projectFileTree)
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

    if (path == '') {
      return this._rootDir
    }

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

    this._dataChange.next(this._rootDir.content)
    this._movedHistory.forEach((newPath, oldPath) => oldPath == newFile.path ? this._movedHistory.delete(newPath) : false)
    this.storage.setProjectTree(this.mapper.exportDirectory(this._rootDir))
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

    const dir = parentDir as ProjectDirectory
    const newElement = this.mapper.constructFakeElement(path)
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
    dir.removeElement(name)
    this.storage.setProjectTree(this.mapper.exportDirectory(this._rootDir))
    this.storage.deleteFileContent(elementToDelete)
    this._dataChange.next(this._rootDir.content)
  }

  /**
   * Saves the current state of the editor into the file tree
   * @param urn The Path of the file to save the content in
   * @param content The content to save in the file identified by the urn
   */
  public syncFileContent(urn : string, content : string | CBCFormula) {
    let urnMoved = false
    let file = this.findByPath(urn)
    if (!file) {
      const historyEntry = this._movedHistory.get(urn)
      this.storage.deleteFileContent(file)

      if (!historyEntry) {
        throw new Error("File not found")
      }

      file = this.findByPath(historyEntry)


      this._movedHistory.delete(urn)
      this.storage.deleteFileContentByPath(urn)
      urnMoved = true

      if (!file) {
        throw new Error("File not found")
      }
    }

    const oldcontent = file.content

    if (content instanceof CBCFormula) {
      content.name = file.name.substring(0, file.name.lastIndexOf('.'))
    }

    file.content = content
    if (oldcontent != file.content && !urnMoved) {
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
      
      this.editorNotify.next()
      this.storage.clear()
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
    const projectTree = this.storage.getProjectTree()
    const projectName = this.storage.getProjectName()
    const projectId = this.storage.getProjectId()

    console.log("download workspace")
    console.log(this.projectId)
    console.log(projectId)
    console.log()


    if (projectId === this.projectId) {
      if (!projectTree) {
        this.network.readProject()
        return
      }
      this._rootDir = this.mapper.importDirectory(projectTree)
      this.dataChange.next(this._rootDir.content)
      if (!projectName) {
        this.network.readProject()
        return
      }
      this._projectname = projectName
      console.log("download for real")
      this.network.readProject()
      return
    } else {
      //Todo: Create dialog asking for allowance to evict local staging differences
    }

    if (!projectId && !this.projectId && !!projectTree) {
      this._rootDir = this.mapper.importDirectory(projectTree)
      this.dataChange.next(this._rootDir.content)
      return
    }

    // if the project id is defined in storage and not by the query parameter
    if (!this.projectId && projectId) {
      this.projectId = projectId
      this.network.readProject()
    }

    if (this.projectId && !projectId) {
      this.storage.setProjectId(this.projectId)
      this.network.readProject()
    }
    
  }

  public moveElement(file : ProjectElement, target : ProjectElement, name?: string, shouldDelete : boolean = true) {
    const oldPath = file.path
    const oldParentPath = file.parentPath
    const newParentPath = target.path

    if (oldParentPath != newParentPath && shouldDelete) {
      this.deleteElement(oldPath, file.name)
      this.storage.deleteFileContent(file)
    }

    let history : Map<string, string> = new Map()

    if (target instanceof ProjectDirectory) {
      history = file.move(target, name)
    } else {
      const parentTarget = this.findByPath(target.parentPath)
      history = file.move(parentTarget as ProjectDirectory, name) 
    }

    this.storage.setFileContent(file.path, (file as ProjectFile).content)

    history.forEach((newPath, oldPath) => this._movedHistory.set(newPath, oldPath))
    this._dataChange.next(this._rootDir.content)
    return history.size > 0
  }

  public toggleRename(element : ProjectElement) {
    const parentPath = element.parentPath
    const parentdir = this.findByPath(parentPath) as ProjectDirectory
    if (!parentdir.addElement(this.mapper.constructRenameElement(parentPath, element))) {
      throw new Error("Could not add rename element")
    }

    element.toggleRename()

    parentdir.removeElement(element.name)
  
    this._dataChange.next(this._rootDir.content)
  }

  public renameElement(element : ProjectElement, name : string) {
    if (!(element instanceof RenameProjectElement)) return

    const toBeMoved = (element as RenameProjectElement).element
    const parent = this.findByPath(toBeMoved.parentPath)

    if (!parent || !(parent instanceof ProjectDirectory)) return

    const parentdir = parent as ProjectDirectory

    toBeMoved.toggleRename()
    parentdir.removeElement(element.name)
    this.moveElement(toBeMoved, parentdir, name, false)
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
