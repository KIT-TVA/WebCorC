import { Injectable } from '@angular/core';
import { CodeFile, DiagramFile, FakeProjectElement, ProjectDirectory, ProjectElement, RenameProjectElement, fakeProjectElementName, renameProjectElementName } from './project-elements';
import { ApiDiagrammFile, ApiDirectory, ApiFile, ApiTextFile, Inode, SlimFile } from './api-elements';
import { CbcFormulaMapperService } from '../mapper/cbc-formula-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectElementsMapperService {

  constructor(private cbcformulaMapper : CbcFormulaMapperService) {}

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
      case "key":    
      case "prove":
      case "other":
      default : return new CodeFile(parentPath, name, fileType)
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

  public exportTree(directory : ProjectDirectory) : ApiDirectory {
    const elements : Inode[] = []

    for (const element of directory.content) {
      
      if (element instanceof ProjectDirectory) {
        elements.push(this.exportTree(element))
      }

      if (element instanceof CodeFile || element instanceof DiagramFile) {
        elements.push(this.exportFileinSlimTree(element))
      }

    }

    return new ApiDirectory(directory.path, elements)
  }

  public exportFileinSlimTree(file : ProjectElement) : Inode {
    return new SlimFile(file.name)
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

  public importProject(directory : ApiDirectory, parentPath : string = "") : ProjectDirectory {
    const childs : ProjectElement[] = []

    let path = parentPath + directory.urn
    path = path.substring(0, path.length -1)

    for (const child of directory.content) {
      if (child.inodeType == "directory") {
        childs.push(
          this.importProject((child as ApiDirectory), path)
        )
      } else if (child.inodeType == "file") {
        childs.push(
          this.importFileInProject(child, parentPath)
        )
      }
    }

    return new ProjectDirectory(parentPath, path, childs)
  }
  
  private importFileInProject(file : Inode, parentPath : string = "") : DiagramFile | CodeFile {
    const lastIndexofPoint = file.urn.lastIndexOf(".")
    const name = file.urn.substring(0, lastIndexofPoint)
    const fileType = file.urn.substring(lastIndexofPoint + 1)

    switch (fileType) {
      case "diagram": return new DiagramFile(parentPath, name, fileType, this.cbcformulaMapper.importFormula((file as ApiDiagrammFile).content))
      case "java": 
      case "key":
      case "prove":
      case "other":
      default: return new CodeFile(parentPath, name, fileType, (file as ApiTextFile).content)
    }
  }

  public constructFakeElement(path : string) : FakeProjectElement {
    return new FakeProjectElement(path)
  }

  public constructRenameElement(path : string, element : ProjectElement) : RenameProjectElement {
    return new RenameProjectElement(path, element)
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

  public get renameElementName() {
    return renameProjectElementName
  }
}
