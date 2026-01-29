import { Injectable } from "@angular/core";
import { BehaviorSubject, first, Subject } from "rxjs";
import { LocalCBCFormula } from "../../types/CBCFormula";
import { NetworkProjectService } from "./network/network-project.service";
import {
  CodeFile,
  DiagramFile,
  ProjectDirectory,
  ProjectElement,
} from "./types/project-elements";
import { ProjectElementsMapperService } from "./types/project-elements-mapper.service";
import { ProjectStorageService } from "./storage/project-storage.service";
import { Inode, LocalDirectory } from "./types/api-elements";

/**
 * Service for project management.
 * This service is the single point of truth for the file tree and file content in the project
 * Used by all components, which interact with the file tree or the content of the files
 */
@Injectable({
  providedIn: "root",
})
export class ProjectService {
  // Use empty string as the project root urn - this aligns with ApiDirectory roots like '/'
  private _rootDir = new ProjectDirectory("/", [], true);
  private _dataChange = new BehaviorSubject<ProjectElement[]>(
    this._rootDir.contents,
  );
  private _saveNotify = new Subject<void>();
  private _savedFinished = new Subject<void>();
  private _projectname: string = "";

  constructor(
    private network: NetworkProjectService,
    private mapper: ProjectElementsMapperService,
    private storage: ProjectStorageService,
  ) {
    const projectIdFromStorage = storage.getProjectId();

    if (projectIdFromStorage) {
      this.network.projectId = projectIdFromStorage;
      const nameFromStorage = storage.getProjectName();
      this.projectname = nameFromStorage ? nameFromStorage : "";
    }

    const projectFileTree = storage.getProjectTree();

    if (projectFileTree) {
      this._rootDir = projectFileTree;
    }
  }

  /**
   * Search for a element of the project by its path recursiv
   * @param urn The path of the element to retrieve
   * @param directory The directory to search for, default: root
   * @returns The file identified by the given path, if no matching file is found null
   * @see ProjectElement
   */
  public findByUrn(
    urn: string,
    directory: ProjectDirectory = this._rootDir,
  ): ProjectElement | null {
    if (urn === this._rootDir.urn) {
      return this._rootDir;
    }
    const parts = urn.split("/").filter((e) => e.length > 0);
    if (parts.length < 1 || directory.urn === urn) {
      return directory;
    }

    const bestMatch = parts.reduce(
      (dir: ProjectElement | undefined, part: string) => {
        if (!dir) return undefined;
        if (dir.type === "DIRECTORY") {
          console.log(dir.urn, part);
          console.log(
            (dir as ProjectDirectory).contents.map(
              (e) => e.urn.split("/").pop() + ", " + part,
            ),
          );
          return (dir as ProjectDirectory).contents.find(
            (element) => element.urn.split("/").pop() === part,
          ) as ProjectElement | undefined;
        }
        return dir as ProjectElement | undefined;
      },
      directory as ProjectElement | undefined,
    );
    if (bestMatch && bestMatch.urn === urn) {
      return bestMatch;
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
  public addDirectory(parentPath: string, name: string): ProjectDirectory {
    console.log(parentPath, name);
    const parentDir = this.findByUrn(parentPath);
    if (name.includes("/")) {
      throw new Error("Directory name contains forbidden character '/'");
    }
    if (parentPath.endsWith("/")) {
      parentPath = parentPath.slice(0, -1);
    }
    if (!parentDir || parentDir.type != "DIRECTORY") {
      throw new Error("Parent dir of new dir not found");
    }

    const dir = parentDir as ProjectDirectory;

    const newDir = new ProjectDirectory(parentPath + "/" + name, [], true);

    if (dir.contents.find((element) => element.urn === newDir.urn)) {
      throw new Error(
        "Could not add directory, maybe you tried to create a duplicate?",
      );
    }

    dir.contents.push(newDir);
    this._dataChange.next(this._rootDir.contents);
    this.storage.saveProject(this._rootDir, this.projectname);
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
  public addFile(
    parentPath: string,
    name: string,
    type: string,
  ): ProjectDirectory {
    console.log(parentPath, name, type);
    const parent = this.findByUrn(parentPath);
    if (parentPath.endsWith("/")) {
      parentPath = parentPath.slice(0, -1);
    }
    const newUrn = parentPath + "/" + name + "." + type;

    if (name.includes("/")) {
      throw new Error("File name contains forbidden character '/'");
    }
    if (!parent || parent.type != "DIRECTORY") {
      throw new Error("Parent directory of new file not found");
    }
    const parentDir = parent as ProjectDirectory;

    if (parentDir.contents.find((element) => element.urn === newUrn)) {
      throw new Error(
        "File with this name already exists in the target directory",
      );
    }

    let newFile: ProjectElement | null = null;
    switch (type) {
      case "java":
        newFile = this.mapper.constructCodeFile(newUrn);
        break;
      case "diagram":
        newFile = this.mapper.constructDiagramFile(newUrn);
        break;
      case "key":
        newFile = this.mapper.constructCodeFile(newUrn);
        break;
      default:
        throw new Error("Could not add file, unknown type");
    }

    parentDir.contents.push(newFile);
    this._dataChange.next(this._rootDir.contents);
    this.storage.saveProject(this._rootDir, this.projectname);
    return parentDir;
  }

  public getParentDirectory(
    element: ProjectElement | string,
  ): ProjectDirectory | undefined {
    let parts: string[] = [];
    if (typeof element === "string") {
      parts = element.split("/");
    } else {
      parts = element.urn.split("/");
    }
    console.log(parts);
    if (parts.length < 2) {
      return this._rootDir;
    }
    const parentUrn = parts.slice(0, parts.length - 1).join("/");
    console.log(parts[parts.length - 2]);
    console.log(parentUrn);
    const parentDir = this.findByUrn(parentUrn);
    if (!parentDir || parentDir.type != "DIRECTORY") {
      return this._rootDir;
    }
    return parentDir as ProjectDirectory;
  }

  /**
   * Delete a project element from the tree
   * @param element
   */
  public deleteElement(element: ProjectElement) {
    let inode: Inode;
    switch (element.type) {
      case "CODE_FILE":
      case "DIAGRAM_FILE":
        inode = this.mapper.exportFile(element);
        break;
      case "DIRECTORY":
        inode = this.mapper.exportDirectory(element as ProjectDirectory);
        break;
      default:
        throw new Error("Unknown element type");
    }
    if (element.serverSideUrn) {
      this.network.deleteFile(inode);
    }
    const parent = this.getParentDirectory(element);

    if (parent) {
      parent.contents = parent.contents.filter(
        (child) => child.urn !== element.urn,
      );
    }
    this.storage.saveProject(this._rootDir, this._projectname);
    this._dataChange.next(this._rootDir.contents);
  }

  /**
   * Saves the current state of the editor into the file tree
   * @param urn The Path of the file to save the content in
   * @param content The content to save in the file identified by the urn
   */
  public syncFileContent(urn: string, content: string | LocalCBCFormula) {
    let file = this.findByUrn(urn);
    if (!file) {
      this._rootDir = this.storage.getProjectTree() ?? this._rootDir;
      file = this.findByUrn(urn);
      if (!file) {
        console.log(this._rootDir);
        throw new Error(`File ${urn} not found. Please create it first`);
      }
      /*
      const parentDir = this.getParentDirectory(urn);
      if (!parentDir) {
        throw new Error("Parent directory not found");
      }
      const type = urn.endsWith(".diagram")
        ? "diagram"
        : urn.endsWith(".java")
          ? "java"
          : "key";
      this.addFile(parentDir?.urn, urn.split("/").pop() || "untitled", type);
       */
    }
    switch (file.type) {
      case "DIAGRAM_FILE":
        (file as DiagramFile).formula = content as LocalCBCFormula;
        break;
      case "CODE_FILE":
        (file as CodeFile).content = content as string;
        break;
      default:
        throw new Error("Unknown file type");
    }

    this._savedFinished.next();
  }

  /**
   * Read the content of the file with the given urn
   * @param urn The path of the file to read the content from
   * @returns The content of the file
   */
  public async getFileContent(urn: string): Promise<string | LocalCBCFormula> {
    let file = this.findByUrn(urn);
    if (!file) {
      const rootDir = this.storage.getProjectTree();
      if (!rootDir) {
        throw new Error("Empty session storage: File not found");
      }
      this._rootDir = rootDir;
      this._dataChange.next(this._rootDir.contents);
      file = this.findByUrn(urn);
      if (!file) {
        throw new Error("File not found");
      }
    }

    const needsToBeFetched = !file.present;

    let content: string | LocalCBCFormula =
      file.type === "CODE_FILE"
        ? ((file as CodeFile).content as string)
        : ((file as DiagramFile).formula as LocalCBCFormula);

    //If file doesn't actually exist yet
    if (this.projectId && needsToBeFetched) {
      content = await this.network.getFileContent(urn);
    }

    if (!this.projectId && needsToBeFetched) {
      throw new Error("Cannot fetch file content without a project ID set");
    }
    // Persist loaded content into the in-memory model so other code (save flows)
    // won't accidentally overwrite it with empty defaults.
    if (file.type === "DIAGRAM_FILE" && content) {
      (file as DiagramFile).formula = content as LocalCBCFormula;
    } else if (file.type === "CODE_FILE" && typeof content === "string") {
      (file as CodeFile).content = content as string;
    } else {
      throw new Error("Unknown file type");
    }
    file.present = true;
    this.storage.saveProject(this._rootDir, this.projectname);
    return content as string | LocalCBCFormula;
  }

  /**
   * Export the project by exporting the root directory to the data only classes
   * @returns
   */
  public export() {
    return this.mapper.exportDirectory(this._rootDir);
  }

  public importProject(rootDir: LocalDirectory, projectname: string) {
    const imported = this.mapper.importProject(rootDir as LocalDirectory);
    this._rootDir = imported;
    this._projectname = projectname;
    this.storage.saveProject(imported, projectname);
    this._dataChange.next(this._rootDir.contents);
  }

  /**
   * Upload the current workspace (optionally waiting for network requests)
   */
  public uploadWorkspace(wait: boolean = false) {
    return new Promise<void>((resolve) => {
      if (!wait) {
        this._savedFinished
          .pipe(first())
          .subscribe(() => this.uploadFolder(this._rootDir));

        this._saveNotify.next();

        this.editorNotify.next();
        this.storage.clear();
        resolve();
        return;
      }

      this.editorNotify.next();

      this.network.requestFinished
        .pipe(first())
        .subscribe(() => this.uploadFolder(this._rootDir));
      this.storage.clear();
      resolve();
    });
  }

  /**
   * Download project state from storage or network as needed
   */
  public downloadWorkspace() {
    const storedProjectTree = this.storage.getProjectTree();
    const storedProjectName = this.storage.getProjectName();
    const storedProjectId = this.storage.getProjectId();
    if (!this.projectId && storedProjectId) {
      this.projectId = storedProjectId;
    }
    if (!storedProjectTree) {
      this.network.readProject().then(() => {
        this._rootDir = this.storage.getProjectTree() ?? this._rootDir;
        this._projectname = this.storage.getProjectName() ?? this._projectname;
        this._dataChange.next(this._rootDir.contents);
      });
      return;
    }
    if (storedProjectId === this.projectId) {
      if (!storedProjectTree || !storedProjectName) {
        this.network.readProject().then(() => {
          this._rootDir = this.storage.getProjectTree() ?? this._rootDir;
          this._projectname =
            this.storage.getProjectName() ?? this._projectname;
          this._dataChange.next(this._rootDir.contents);
        });
        return;
      }
      this._rootDir = storedProjectTree;
      this._dataChange.next(this._rootDir.contents);
      return;
    }

    if (!storedProjectId && !this.projectId && !!storedProjectTree) {
      this._rootDir = storedProjectTree;
      this._dataChange.next(this._rootDir.contents);
      return;
    }
  }

  /**
   * Create a project in the backend
   */
  public async createProject() {
    if (!this._projectname || this._projectname.trim() === "") {
      throw new Error("Project name cannot be empty");
    }
    await this.network.createProject(this._projectname);
    this.projectId = this.network.projectId!;
    return this.storage.setProjectId(this.projectId!);
  }

  private uploadFolder(folder: ProjectDirectory) {
    for (const item of folder.contents) {
      switch (item.type) {
        case "DIRECTORY":
          this.uploadFolder(item as ProjectDirectory);
          continue;
        case "CODE_FILE":
        case "DIAGRAM_FILE":
          this.network.uploadFile(this.mapper.exportFile(item));
          break;
        default:
          throw new Error("Unknown element type");
      }
    }
  }

  /**
   * Move a element in the project
   */
  public moveElement(
    file: ProjectElement,
    target: ProjectElement,
    name?: string,
  ) {
    const newParentPath = target.path;
    const oldUrn = file.urn + "";

    if (
      target instanceof ProjectDirectory &&
      target &&
      target.addElement(file)
    ) {
      const newUrn = newParentPath + "/" + (name ? name : file.name);
      file.urn = newUrn;

      // If we're moving a directory, recursively update all children URNs
      if (file.type === "DIRECTORY") {
        const dir = file as ProjectDirectory;
        const oldPrefix = oldUrn.endsWith("/") ? oldUrn : oldUrn + "/";
        const newPrefix = newUrn.endsWith("/") ? newUrn : newUrn + "/";

        const updateChild = (child: ProjectElement) => {
          if (child.urn.startsWith(oldPrefix)) {
            child.urn = newPrefix + child.urn.substring(oldPrefix.length);
          }
          if (child.type === "DIRECTORY") {
            (child as ProjectDirectory).contents.forEach(updateChild);
          }
        };

        dir.contents.forEach(updateChild);
      }
    } else {
      return false;
    }
    console.log(oldUrn);
    const oldParent = this.getParentDirectory(oldUrn);
    console.log(oldParent);
    if (oldParent) {
      console.log(
        "removing from old parent",
        oldParent.urn,
        file.name,
        file.urn,
      );
      oldParent.removeElement(file.name);
    }
    this._dataChange.next(this._rootDir.contents);
    return true;
  }

  /**
   * Rename the element
   */
  public renameElement(element: ProjectElement, name: string) {
    if (name.includes("/")) {
      throw new Error("Element name contains forbidden character '/'");
    }
    if (name.trim() === "") {
      throw new Error("Element name cannot be empty");
    }
    const parentPath = element.parentPath;
    const oldUrn = element.urn;
    const newUrn = parentPath + "/" + name;
    element.urn = newUrn;

    // If we're renaming a directory, recursively update all children URNs
    if (element.type === "DIRECTORY") {
      const dir = element as ProjectDirectory;
      const oldPrefix = oldUrn.endsWith("/") ? oldUrn : oldUrn + "/";
      const newPrefix = newUrn.endsWith("/") ? newUrn : newUrn + "/";

      const updateChild = (child: ProjectElement) => {
        if (child.urn.startsWith(oldPrefix)) {
          child.urn = newPrefix + child.urn.substring(oldPrefix.length);
        }
        if (child.type === "DIRECTORY") {
          (child as ProjectDirectory).contents.forEach(updateChild);
        }
      };

      dir.contents.forEach(updateChild);
    }

    this.storage.saveProject(this._rootDir, this._projectname);
    this._dataChange.next(this._rootDir.contents);
  }

  public notifyEditortoSave() {
    this._saveNotify.next();
  }

  public get editorNotify() {
    return this._saveNotify;
  }

  public get explorerNotify() {
    return this._savedFinished;
  }

  public get root() {
    return this._rootDir;
  }

  public get dataChange() {
    return this._dataChange;
  }

  public get projectname(): string {
    return this._projectname;
  }

  public set projectname(value: string) {
    this._projectname = value;
  }

  public set projectId(value: string) {
    this.network.projectId = value;
  }

  public get projectId(): string | undefined {
    return this.network.projectId;
  }

  public get requestFinished() {
    return this.network.requestFinished;
  }

  public get shouldCreateProject(): boolean {
    return this.network.projectId === undefined;
  }

  public dump() {
    return {
      projectId: this.projectId,
      projectName: this.projectname,
      rootDir: this._rootDir,
    };
  }
}
