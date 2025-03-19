import { Injectable } from '@angular/core';
import { CodeFile, DiagramFile, FakeProjectElement, ProjectDirectory, ProjectElement, ProjectFile, RenameProjectElement, fakeProjectElementName, renameProjectElementName } from './project-elements';
import { ApiDiagrammFile, ApiDirectory, ApiFile, ApiTextFile, Inode, SlimFile } from './api-elements';
import { CbcFormulaMapperService } from '../mapper/cbc-formula-mapper.service';

/**
 * Service for mapping the json objects of the project elements interfaces to the corresponding classes for using functions of the classes.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectElementsMapperService {

  constructor(private cbcformulaMapper : CbcFormulaMapperService) {}

  /**
   * Import the directory
   * @param directory The directory to import
   * @param parentPath The path of the directory to import from
   * @returns Instance of ProjectDirectory to represent the same directory structure
   */
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

  /**
   * Export the directory to the api compatible structure with file content
   * @param directory The directory to export
   * @returns The exported directory
   */
  public exportDirectory(directory : ProjectDirectory) : ApiDirectory {
    const elements : Inode[] = []

    for (const element of directory.content) {
      
      if (element instanceof ProjectDirectory) {
        elements.push(this.exportDirectory(element))
      }

      if (element instanceof ProjectFile) {
        elements.push(this.exportFile(element))
      }

    }

    return new ApiDirectory(directory.path, elements)
  }

  /**
   * Export the project tree without the content of the files
   * @param directory the directory to export 
   * @returns file tree without the file content
   */
  public exportTree(directory : ProjectDirectory) : ApiDirectory {
    const elements : Inode[] = []

    for (const element of directory.content) {
      
      if (element instanceof ProjectDirectory) {
        elements.push(this.exportTree(element))
      }

      if (element instanceof ProjectFile) {
        elements.push(this.exportFileinSlimTree(element))
      }

    }

    return new ApiDirectory(directory.path, elements)
  }


  /**
   * Export file to api compatbile structure
   * @param file The file to export
   * @returns The inode with the file content
   */
  public exportFile(file : ProjectElement) : Inode {
    let inode : Inode 
    if (file instanceof DiagramFile) {
      inode = new ApiDiagrammFile(file.path, file.content)
    } else {
      inode = new ApiTextFile(file.path, (file as CodeFile).content)
    }

    return inode
  }
  
  /**
   * Import project from the api directory content
   * @param directory The directory to import 
   * @param parentPath The parentpath of the imported directory
   * @returns directory in compatible form for internal use
   */
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




  /**
   * Construct a new fake element. 
   * Needs to be placed in this service because of circular dependencies.
   * @param path The path of the parent element to place the element under
   * @returns the new element
   */
  public constructFakeElement(path : string) : FakeProjectElement {
    return new FakeProjectElement(path)
  }

  /**
   * Construct a new Rename Element.
   * Needs to be placed in this service because of circular dependencies.
   * @param path The path of the parent element to place the element under
   * @param element the element to be renamed
   * @returns The new Element for renaming.
   */
  public constructRenameElement(path : string, element : ProjectElement) : RenameProjectElement {
    return new RenameProjectElement(path, element)
  }

  /**
   * Construct new Code file.
   * Needs to be placed in this service because of circular dependencies.
   * @param relativePath The path of the parent element of the new code file
   * @param name The name of the file 
   * @param type The type of the file
   * @returns The new CodeFile
   */
  public constructCodeFile(relativePath : string, name : string, type : string) : CodeFile {
    return new CodeFile(relativePath, name, type)
  }

  /**
   * Construct new Diagram file.
   * Needs to be placed in this service because of circular dependencies.
   * @param relativePath The path of the parent element of the new code file
   * @param name The name of the file 
   * @param type The type of the file
   * @returns The new Diagram File
   */
  public constructDiagramFile(relativePath : string, name : string, type : string) : DiagramFile {
    return new DiagramFile(relativePath, name, type)
  }

  /**
   * Needs to be implemented in this service to reduce circular dependencies.
   */
  public get fakeElementName() {
    return fakeProjectElementName
  }

  /**
   * Needs to be implemented in this service to reduce circular dependencies.
   */
  public get renameElementName() {
    return renameProjectElementName
  }

  private exportFileinSlimTree(file : ProjectElement) : Inode {
    return new SlimFile(file.name)
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
}
