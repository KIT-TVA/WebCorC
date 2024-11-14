import { Injectable } from '@angular/core';
import { ProjectDirectory } from './project-directory';
import { CodeFile, DiagramFile } from './project-files';
import { ProjectElement } from './project-element';
import { BehaviorSubject, Subject, first} from 'rxjs';
import { FakeProjectElement, fakeProjectElementName } from './fake-element';
import { CBCFormula } from './CBCFormula';
import { ApiDirectory, Inode } from '../../types/project/inode';
import { NetworkProjectService } from './network/network-project.service';

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
  private _projectname: string = "";

  constructor(private network : NetworkProjectService) {

    this.network.dataChange.subscribe((rootDir : ApiDirectory) => {
      // Todo: On Changes after network requests update file tree
      this._rootDir = rootDir.import()
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

    dir.removeElement(fakeProjectElementName)

    const newDir = new ProjectDirectory(relativePath, name);
    if (!dir.addElement(newDir)) {
      throw new Error("Could not add directory, maybe you tried to create a duplicate?")
    }

    this._dataChange.next(this._rootDir.content)
    return dir;
  }

  /**
   * Add a file to the filr tree.
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

    dir.removeElement(fakeProjectElementName)

    let newFile = null 

    switch (type) {
      case "java" : newFile = new CodeFile(relativePath, name, type); break;
      case "diagram" : newFile = new DiagramFile(relativePath, name, type); break;
      default: throw new Error("Could not add file, unknown type")
    }
    
    if (!dir.addElement(newFile)) {
      throw new Error("Could not add file, maybe you tried to create a duplicate?")
    }

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
    const newElement = new FakeProjectElement(path);
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
    if (parentDirPath.endsWith('//')) {
      parentDirPath = parentDirPath.slice(0, parentDirPath.length - 1)
    }

    const parentDir = this.findByPath(parentDirPath)

    if (!parentDir) {
      throw new Error("Parent dir of element to delete not found")
    }

    const dir = parentDir as ProjectDirectory
    dir.removeElement(name);
    this._dataChange.next(this._rootDir.content)
  }

  /**
   * Saves the current state of the editor into the file tree
   * @param urn The Path of the file to save the content in
   * @param content The content to save in the file identified by the urn
   */
  public syncFileContent(urn : string, content : string | CBCFormula) {
    const file = this.findByPath(urn)
    if (!file) {
      throw new Error("File not found")
    }

    file.content = content
    this._savedFinished.next()
  }

  /**
   * Read the content of the file with the given urn
   * @param urn The path of the file to read the content from
   * @returns The content of the file
   */
  public async getFileContent(urn : string) : Promise<string | CBCFormula> {
    const file = this.findByPath(urn)
    if (!file) {
      throw new Error("File not found")
    }

    let needstoBeFetched = false

    if (file.content instanceof CBCFormula) {
      needstoBeFetched = (file.content as CBCFormula).statement === null
    }

    if (file.content instanceof String) {
      needstoBeFetched = (file.content as string) === ""
    }

    console.log(file.content && this.projectId)
    // if file content is default value and projectId is set
    if (this.projectId && needstoBeFetched) {
      const content = await this.network.getFileContent(urn)
      if (content instanceof CBCFormula) {
        file.content  = <CBCFormula>content
      } else {
        file.content = content
      }
    }

    return (file as CodeFile | DiagramFile).content
  }

  /**
   * Export the project by exporting the root directory to the data only classes
   * @returns 
   */
  public export() : Inode {
    return this._rootDir.export()
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
  }


  private uploadFolder(folder : ProjectDirectory) {
    for (const item of folder.content) {
      if (item instanceof ProjectDirectory) {
        this.uploadFolder(item)
      } else {
        this.network.uploadFile(item.export())
      }
    }
  }


  public get shouldCreateProject() : boolean {
    return this.network.projectId === undefined
  }


  public createProject() {
    this.network.createProject(this._projectname)
  }


  public downloadWorkspace() {
    this.network.readProject()
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
    return this._rootDir.content.length == 0
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

}
