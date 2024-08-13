import { Injectable } from '@angular/core';
import { ProjectDirectory } from './project-directory';
import { ProjectFile } from './project-file';
import { ProjectElement } from './project-element';
import { BehaviorSubject } from 'rxjs';
import { FakeProjectElement, fakeProjectElementName } from './fake-element';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private _rootDir = new ProjectDirectory("/","root")
  private _dataChange = new BehaviorSubject<ProjectElement[]>(this._rootDir.content)

  constructor() {
  }


  public findByPath(path : string, directory : ProjectDirectory = this._rootDir) : ProjectElement | null {
    if (directory.path === path) {
      return directory
    }

    for (const child of directory.content) {
      if (child.path === path) { return child; }
      if (child instanceof ProjectDirectory && path.includes(child.name) ) {
        return this.findByPath(path, child);
      }
    }

    return null;
  }

  public addDirectory(parentPath : string, name : string) : ProjectDirectory {
    const parentDir = this.findByPath(parentPath);
    if (!parentDir) {
      throw new Error("Parent dir of new dir not fournd");
    }

    const dir = parentDir as ProjectDirectory

    dir.removeElement(fakeProjectElementName)

    const newDir = new ProjectDirectory(parentPath, name);
    if (!dir.addElement(newDir)) {
      throw new Error("Could not add directory, maybe you tried to create a duplicate?")
    }

    this._dataChange.next(this._rootDir.content)
    return dir;
  }

  public addFile(parentPath : string, name : string, type: string) : ProjectDirectory { 
    const parentDir = this.findByPath(parentPath);
    if (!parentDir) {
      throw new Error("Parent dir of new file not found")
    }

    const dir = parentDir as ProjectDirectory

    dir.removeElement(fakeProjectElementName)

    const newFile = new ProjectFile(parentPath, name, type)
    if (!dir.addElement(newFile)) {
      throw new Error("Could not add file, maybe you tried to create a duplicate?")
    }

    this._dataChange.next(this._rootDir.content)
    return dir;
  }

  public addElement(path : string) {
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

  public deleteElement(path : string, name : string) {
    let parentDirPath = path.replace(name, '')
    if (parentDirPath.endsWith('//')) {
      parentDirPath = parentDirPath.slice(0, parentDirPath.length - 1)
    }

    console.log(parentDirPath)

    const parentDir = this.findByPath(parentDirPath)

    console.log(parentDir)

    if (!parentDir) {
      throw new Error("Parent dir of element to delete not found")
    }

    const dir = parentDir as ProjectDirectory
    dir.removeElement(name);
    this._dataChange.next(this._rootDir.content)
  }

  get root() { 
    return this._rootDir
  }

  get dataChange() {
    return this._dataChange
  }


}
