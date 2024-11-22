import { Injectable } from '@angular/core';
import { CodeFile, DiagramFile, FakeProjectElement, ProjectDirectory, ProjectElement, fakeProjectElementName } from './project-elements';
import { ApiDiagrammFile, ApiDirectory, ApiFile, ApiTextFile, Inode } from './api-elements';

@Injectable({
  providedIn: 'root'
})
export class ProjectElementsMapperService {

  constructor() {}

  public importDirectory(directory : ApiDirectory, parentPath : string = "") : ProjectDirectory {
    const childs : ProjectElement[] = []

    let path = parentPath + directory.urn + "/"
    if (parentPath == "" && directory.urn == "") {
      path = ""
    }

    for (const child of directory.content) {
      if (child.inodeType == "directory") {
        childs.push(
          this.importDirectory((child as ApiDirectory), path)
        )
      } else if (child.inodeType == "file") {
        childs.push(
          this.importFile((child as ApiFile), path)
        )
      }
    }

    return new ProjectDirectory(parentPath, directory.urn, childs)
  }
  
  private importFile(file : ApiFile, parentPath : string = "") : ProjectElement {
    const lastIndexofPoint = file.urn.lastIndexOf(".")
    const name = file.urn.substring(0, lastIndexofPoint)
    const fileType = file.urn.substring(lastIndexofPoint + 1)


    switch (fileType) {
      case "diagram" : return new DiagramFile(parentPath, name, file.type)
      case "java":    
      case "prove":
      case "other":
      default : return new CodeFile(parentPath, name, file.type)
    }
  }

  public exportDirectory(directory : ProjectDirectory) : ApiDirectory {
    const elements : Inode[] = []

    for (const element of directory.content) {
      
      if (element instanceof ProjectDirectory) {
        elements.push(this.exportDirectory(element))
      }

      if (element instanceof CodeFile || element instanceof DiagramFile) {
        elements.push(this.exportFile(element))
      }

    }

    return new ApiDirectory(directory.path, elements)
  }

  public exportFile(file : ProjectElement) : Inode {
    let inode : Inode 
    if (file instanceof DiagramFile) {
      inode = new ApiDiagrammFile(file.path, file.content)
    } else {
      inode = new ApiTextFile(file.path, (file as CodeFile).content)
    }

    return inode
  }

  public constructFakeElement(path : string) : FakeProjectElement {
    return new FakeProjectElement(path)
  }

  public constructCodeFile(relativePath : string, name : string, type : string) : CodeFile {
    return new CodeFile(relativePath, name, type)
  }

  public constructDiagramFile(relativePath : string, name : string, type : string) : DiagramFile {
    return new DiagramFile(relativePath, name, type)
  }


  public get fakeElementName() {
    return fakeProjectElementName
  }
}
