import { Injectable } from "@angular/core";
import {
  CodeFile,
  DiagramFile,
  IProjectElement,
  ProjectDirectory,
  ProjectElement,
} from "./project-elements";
import {
  ApiDiagramFile,
  ApiDirectory,
  ApiTextFile,
  Inode,
  LocalDiagramFile,
  LocalDirectory,
  LocalFile,
  LocalTextFile,
  SlimFile,
} from "./api-elements";
import { CbcFormulaMapperService } from "../mapper/cbc-formula-mapper.service";
import { LocalCBCFormula } from "../../../types/CBCFormula";

/**
 * Service for mapping the json objects of the project elements interfaces to the corresponding classes for using functions of the classes.
 */
@Injectable({
  providedIn: "root",
})
export class ProjectElementsMapperService {
  constructor(private cbcformulaMapper: CbcFormulaMapperService) {}

  /**
   * Import the directory
   * @param directory The directory to import
   * @returns Instance of ProjectDirectory to represent the same directory structure
   */
  public importDirectory(directory: LocalDirectory): ProjectDirectory {
    return new ProjectDirectory(
      directory.urn,
      directory.content.map((element) => {
        switch (element.inodeType) {
          case "directory":
            return this.importDirectory(element as LocalDirectory);
          case "file":
            return this.importFile(element as LocalFile);
          default:
            throw new Error(`Unknown inode type: ${element.inodeType}`);
        }
      }),
      directory.present,
    );
  }

  private importFile(file: LocalFile): ProjectElement {
    const lastIndexofPoint = file.urn.lastIndexOf(".");
    const fileType =
      lastIndexofPoint >= 0
        ? file.urn.substring(lastIndexofPoint + 1)
        : file.type;

    switch (fileType) {
      case "diagram":
        return new DiagramFile(
          file.urn,
          (file as LocalDiagramFile).content,
          file.present,
        );
      case "java":
      case "key":
      case "proof":
      default:
        return new CodeFile(
          file.urn,
          (file as LocalTextFile).content,
          file.present,
        );
    }
    throw new Error(`Unknown file type: ${fileType}`);
  }

  /**
   * Export the directory to the api compatible structure with file content
   * @param directory The directory to export
   * @returns The exported directory
   */
  public exportDirectory(directory: ProjectDirectory): ApiDirectory {
    const elements: Inode[] = [];

    for (const element of directory.contents) {
      if (element.type === "DIRECTORY") {
        elements.push(this.exportDirectory(element as ProjectDirectory));
        continue;
      }

      if (element.type === "CODE_FILE" || element.type === "DIAGRAM_FILE") {
        elements.push(this.exportFile(element));
      }
    }

    return new ApiDirectory(directory.urn, elements);
  }

  /**
   * Export the project tree without the content of the files
   * @param directory the directory to export
   * @returns file tree without the file content
   */
  public exportTree(directory: ProjectDirectory): ApiDirectory {
    const elements: Inode[] = [];

    for (const element of directory.contents) {
      if (element instanceof ProjectDirectory) {
        elements.push(this.exportTree(element));
        continue;
      }

      // slim file
      elements.push(this.exportFileinSlimTree(element));
    }

    return new ApiDirectory(directory.urn, elements);
  }

  /**
   * Export file to api compatbile structure
   * @param file The file to export
   * @returns The inode with the file content
   */
  public exportFile(file: ProjectElement): Inode {
    let inode: Inode;
    if (
      file.constructor.name === "DiagramFile" ||
      (file as DiagramFile).formula !== undefined
    ) {
      inode = new ApiDiagramFile(
        file.urn,
        this.cbcformulaMapper.exportFormula((file as DiagramFile).formula),
      );
    } else {
      inode = new ApiTextFile(
        file.urn,
        (file as CodeFile).content as string,
        "file",
      );
    }

    return inode;
  }

  /**
   * Import project from the api directory content
   * @param directory The directory to import
   * @returns directory in compatible form for internal use
   */
  public importProject(directory: LocalDirectory): ProjectDirectory {
    // importDirectory already handles ApiDirectory => ProjectDirectory conversion
    return this.importDirectory(directory);
  }

  /**
   * Construct new Code file.
   * Needs to be placed in this service because of circular dependencies.
   * @param relativePath The path of the parent element of the new code file
   * @returns The new CodeFile
   */
  public constructCodeFile(relativePath: string): CodeFile {
    return new CodeFile(relativePath, "", true);
  }

  /**
   * Construct new Diagram file.
   * Needs to be placed in this service because of circular dependencies.
   * @param relativePath The path of the parent element of the new code file
   * @returns The new Diagram File
   */
  public constructDiagramFile(relativePath: string): DiagramFile {
    return new DiagramFile(relativePath, new LocalCBCFormula(), true);
  }

  private exportFileinSlimTree(file: ProjectElement): Inode {
    return new SlimFile(file.urn);
  }

  public parseProjectTree(tree: IProjectElement): ProjectDirectory {
    if (tree.type === "DIRECTORY") {
      const dir = tree as ProjectDirectory;
      return new ProjectDirectory(
        dir.urn,
        dir.contents.map((el) => this.parseProjectElement(el)),
        tree.present,
      );
    }
    throw new Error(`Root element must be a directory, got: ${tree.type}`);
  }

  private parseProjectElement(element: IProjectElement): ProjectElement {
    if (element.type === "DIRECTORY") {
      const dir = element as ProjectDirectory;
      return new ProjectDirectory(
        dir.urn,
        dir.contents.map((el) => this.parseProjectElement(el)),
        dir.present,
      );
    }
    if (element.type === "CODE_FILE") {
      const file = element as CodeFile;
      return new CodeFile(file.urn, file.content, file.present);
    }
    if (element.type === "DIAGRAM_FILE") {
      const file = element as DiagramFile;
      return new DiagramFile(file.urn, file.formula, file.present);
    }
    throw new Error(`Unknown project element type: ${element.type}`);
  }
}
