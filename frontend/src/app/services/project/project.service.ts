import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, firstValueFrom, Subject } from "rxjs";
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
import { ProjectPredicate } from "../../types/ProjectPredicate";
import { VerifierOverrides } from "../../types/Verifier";
import { GlobalSettingsService } from "../global-settings.service";

/**
 * Service for project management.
 * This service is the single point of truth for the file tree and file content in the project
 * Used by all components, which interact with the file tree or the content of the files
 */
@Injectable({
  providedIn: "root",
})
export class ProjectService {
  private network = inject(NetworkProjectService);
  private mapper = inject(ProjectElementsMapperService);
  private storage = inject(ProjectStorageService);
  private settings = inject(GlobalSettingsService);

  // Use empty string as the project root urn - this aligns with ApiDirectory roots like '/'
  private _rootDir = new ProjectDirectory("", [], true);
  private _dataChange = new BehaviorSubject<ProjectElement[]>(
    this._rootDir.contents,
  );
  private _saveNotify = new Subject<void>();
  private _savedFinished = new Subject<void>();
  private _verifierOverridesLoaded = new Subject<void>();
  private _projectName: string = "";
  private rubbishBinName = ".rubbishBin";

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    const storage = this.storage;

    const projectIdFromStorage = storage.getProjectId();
    if (projectIdFromStorage) {
      this.network.projectId = projectIdFromStorage;
      const nameFromStorage = storage.getProjectName();
      this.projectName = nameFromStorage ?? "";
    }

    const projectFileTree = storage.getProjectTree();
    if (projectFileTree) {
      this._rootDir = projectFileTree;
    }
  }

  /**
   * Search for an element of the project by its path recursively
   * @param urn The path of the element to retrieve
   * @param directory The directory to begin searching in default: root
   * @returns The file identified by the given path, if no matching file is found null
   * @see ProjectElement
   */
  public findByUrn(
    urn: string,
    directory: ProjectDirectory = this._rootDir,
  ): ProjectElement | null {
    const normalizedUrn = urn.startsWith("/") ? urn.slice(1) : urn;
    const normalizedDirUrn = directory.urn.startsWith("/")
      ? directory.urn.slice(1)
      : directory.urn;

    if (normalizedUrn === normalizedDirUrn) {
      return directory;
    }

    const parts = normalizedUrn.split("/").filter((e) => e.length > 0);
    if (parts.length < 1) {
      return directory;
    }

    let current: ProjectElement = directory;
    for (const part of parts) {
      if (current.type !== "DIRECTORY") {
        return null;
      }
      const found = (current as ProjectDirectory).contents.find(
        (element) => element.urn.split("/").pop() === part,
      );
      if (!found) return null;
      current = found;
    }

    return current.urn === urn || current.urn === normalizedUrn
      ? current
      : null;
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
    console.log("Adding Directory", parentPath, name);
    const parentDir = this.findByUrn(parentPath);
    if (name.includes("/")) {
      throw new Error("Directory name contains forbidden character '/'");
    }
    if (parentPath.endsWith("/")) {
      parentPath = parentPath.slice(0, -1);
    }
    if (parentDir && parentDir.type === "DIRECTORY") {
      const definedParentDir = parentDir as ProjectDirectory;
      let newDir = new ProjectDirectory(parentPath + "/" + name, [], true);
      if (parentPath === "") {
        newDir = new ProjectDirectory(name, [], true);
      }

      if (
        definedParentDir.contents.find((element) => element.urn === newDir.urn)
      ) {
        throw new Error(
          "Could not add directory, maybe you tried to create a duplicate?",
        );
      }

      definedParentDir.contents.push(newDir);
      this._dataChange.next(this._rootDir.contents);
      this.storage.saveProject(this._rootDir, this.projectName);
      return definedParentDir;
    }
    throw new Error("Parent directory of new directory not found");
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
    console.log("Creating file", parentPath, name, type);
    const parent = this.findByUrn(parentPath);
    if (parentPath.endsWith("/")) {
      parentPath = parentPath.slice(0, -1);
    }
    const newUrn =
      parentPath === ""
        ? name + "." + type
        : parentPath + "/" + name + "." + type;

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
      case "json":
        newFile = this.mapper.constructCodeFile(newUrn);
        break;
      default:
        throw new Error("Could not add file, unknown type");
    }

    parentDir.contents.push(newFile);
    this._dataChange.next(this._rootDir.contents);
    this.storage.saveProject(this._rootDir, this.projectName);
    return parentDir;
  }

  public getParentDirectory(
    element: ProjectElement | string,
    directory: ProjectDirectory = this._rootDir,
  ): ProjectDirectory | undefined {
    let parts: string[];
    if (typeof element === "string") {
      parts = element.split("/");
    } else {
      parts = element.urn.split("/");
    }
    if (parts.length < 2) {
      return directory;
    }
    const parentUrn = parts.slice(0, parts.length - 1).join("/");
    const parentDir = this.findByUrn(parentUrn, directory);
    if (!parentDir || parentDir.type != "DIRECTORY") {
      return directory;
    }
    return parentDir as ProjectDirectory;
  }

  /**
   * Delete a project element from the tree
   * @param element
   */
  public deleteElement(element: ProjectElement) {
    const rubbishBin = this.getRubbishBin();

    if (this.elementIsInRubbishBin(element)) {
      this.permanentlyDeleteElement(element);
      console.log(`Element ${element.urn} deleted permanently`);
    } else {
      this.moveElement(element, rubbishBin);
      console.log(`Element ${element.urn} moved to rubbish bin`);
    }
    this.storage.saveProject(this._rootDir, this._projectName);
    this._dataChange.next(this._rootDir.contents);
  }

  private getRubbishBin() {
    let rubbishBin = this.findByUrn(this.rubbishBinName) as ProjectDirectory;
    if (!rubbishBin) {
      this.addDirectory("", this.rubbishBinName);
      rubbishBin = this.findByUrn(this.rubbishBinName) as ProjectDirectory;
    }
    return rubbishBin;
  }

  private elementIsInRubbishBin(element: ProjectElement) {
    return element.urn.startsWith(this.rubbishBinName);
  }

  private permanentlyDeleteElement(element: ProjectElement) {
    const parent = this.getParentDirectory(element);

    if (parent) {
      parent.contents = parent.contents.filter(
        (child) => child.urn !== element.urn,
      );
    }
  }

  public async clearRubbishBin() {
    const rubbishBinName = ".rubbishBin";
    const rubbishBin = this.findByUrn("/" + rubbishBinName) as ProjectDirectory;

    if (!rubbishBin) {
      return;
    }

    // Recursively delete contents
    const deleteContents = async (dir: ProjectDirectory) => {
      for (const item of [...dir.contents]) {
        if (item.type === "DIRECTORY") {
          await deleteContents(item as ProjectDirectory);
        }
        await this.deleteElement(item);
      }
    };

    await deleteContents(rubbishBin);

    // Remove the bin itself
    const parent = this.getParentDirectory(rubbishBin);
    if (parent) {
      parent.removeElement(rubbishBin.name);
    }
    this.storage.saveProject(this._rootDir, this._projectName);
    this._dataChange.next(this._rootDir.contents);
  }

  /**
   * Saves the current state of the editor into the file tree
   * @param urn The Path of the file to save the content in
   * @param content The content to save in the file identified by the urn
   */
  public syncLocalFileContent(urn: string, content: string | LocalCBCFormula) {
    let file = this.findByUrn(urn);
    if (!file) {
      this._rootDir = this.storage.getProjectTree() ?? this._rootDir;
      file = this.findByUrn(urn);
      if (!file) {
        console.log(this._rootDir);
        throw new Error(`File ${urn} not found. Please create it first`);
      }
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
    this.storage.saveProject(this._rootDir, this.projectName);
    this._savedFinished.next();
    if (this.settings.autosave && this.projectId) {
      this.network.uploadFile(this.mapper.exportFile(file));
    }
  }

  /**
   * Read the content of the file with the given urn
   * @param urn The path of the file to read the content from
   * @returns The content of the file
   */
  public async getFileContent(urn: string): Promise<string | LocalCBCFormula> {
    let file = this.findByUrn(urn);
    if (!file) {
      const remoteTree = this.storage.getRemoteProjectTree();
      if (remoteTree) {
        file = this.findByUrn(urn, remoteTree);
      }
      if (!file) {
        throw new Error("File not found in local or remote storage");
      }
    }

    let content: string | LocalCBCFormula =
      file.type === "CODE_FILE"
        ? ((file as CodeFile).content as string)
        : ((file as DiagramFile).formula as LocalCBCFormula);

    // If file not in local storage yet
    if (!file.present) {
      if (!this.projectId) {
        throw new Error("Cannot fetch file content without a project ID set");
      }
      content = await this.network.getFileContent(urn);
      this.syncLocalFileContent(urn, content);
    }

    if (file.type === "DIAGRAM_FILE" && content) {
      (file as DiagramFile).formula = content as LocalCBCFormula;
    } else if (file.type === "CODE_FILE" && typeof content === "string") {
      (file as CodeFile).content = content as string;
    } else {
      throw new Error("Unknown file type");
    }

    file.present = true;
    this.storage.saveProject(this._rootDir, this.projectName);
    return content as string | LocalCBCFormula;
  }

  public savePredicates(predicates: ProjectPredicate[]) {
    this.storage.setPredicates(predicates);

    const internalDirName = ".internal";
    const predicatesFileName = "predicates";
    const predicatesFileExtension = "key";
    const predicatesFileUrn = `${internalDirName}/${predicatesFileName}.${predicatesFileExtension}`;

    if (!this.findByUrn(internalDirName)) {
      this.addDirectory("", internalDirName);
    }

    if (!this.findByUrn(predicatesFileUrn)) {
      this.addFile(
        internalDirName,
        predicatesFileName,
        predicatesFileExtension,
      );
    }

    try {
      this.syncLocalFileContent(
        predicatesFileUrn,
        JSON.stringify(predicates, null, 2),
      );
    } catch (e) {
      console.error(`Could not sync predicates file: ${e}`);
    }
  }

  public getPredicates(): ProjectPredicate[] {
    return this.storage.getPredicates();
  }

  public saveVerifierOverrides(overrides: VerifierOverrides) {
    this.storage.setVerifierOverrides(overrides);

    const internalDirName = ".internal";
    const verifiersFileName = "verifiers";
    const verifiersFileExtension = "json";
    const verifiersFileUrn = `${internalDirName}/${verifiersFileName}.${verifiersFileExtension}`;

    if (!this.findByUrn(internalDirName)) {
      this.addDirectory("", internalDirName);
    }

    if (!this.findByUrn(verifiersFileUrn)) {
      this.addFile(internalDirName, verifiersFileName, verifiersFileExtension);
    }

    try {
      this.syncLocalFileContent(
        verifiersFileUrn,
        JSON.stringify(overrides, null, 2),
      );
    } catch (e) {
      console.error(`Could not sync verifiers file: ${e}`);
    }
  }

  public getVerifierOverrides(): VerifierOverrides | null {
    return this.storage.getVerifierOverrides();
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
    this._projectName = projectname;
    this.storage.saveProject(imported, projectname);
    this.loadPredicatesFromFile();
    this.loadVerifiersFromFile();
    this._dataChange.next(this._rootDir.contents);
  }

  /**
   * Upload the current workspace (optionally waiting for network requests)
   */
  public async uploadWorkspace() {
    try {
      console.log("Before preparing upload", this._rootDir);

      // Log current listeners to help debug deadlocks
      console.log("Preparing to wait for _savedFinished emission");

      // Start listening for the next save completion BEFORE notifying editors
      const savedFinishedPromise = firstValueFrom(this._savedFinished);

      // Tell editors (and other listeners) to flush their state
      this._saveNotify.next();
      this.editorNotify.next();

      // If no editor is open (or no one responds), avoid deadlock by timing out
      const timeoutMs = 300;
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn(
            `uploadWorkspace: save-finished event did not fire within ${timeoutMs}ms; continuing with last known state`,
          );
          resolve();
        }, timeoutMs);
      });

      await Promise.race([savedFinishedPromise, timeoutPromise]);

      console.log("After preparing upload", this._rootDir);
      await this.uploadFolder(this._rootDir);
      await this.downloadWorkspace();
    } catch (error) {
      console.error("Failed to upload workspace:", error);
      // In a real scenario, we would trigger a notification to the user here
      throw error;
    }
    return;
  }

  /**
   * Download project state from storage or network as needed
   */
  public async downloadWorkspace() {
    try {
      const localProjectTree = this.storage.getProjectTree();
      const localProjectName = this.storage.getProjectName();
      const localProjectId = this.storage.getProjectId();

      if (!this.projectId && localProjectId) {
        this.projectId = localProjectId;
      }

      if (this.projectId) {
        const {
          project: remoteProject,
          name,
          id,
        } = await this.network.readProject();
        this.storage.saveRemoteProject(remoteProject, name);
        this.storage.setProjectId(id);

        if (!localProjectTree) {
          this.storage.saveProject(remoteProject, name);
          this._rootDir = remoteProject;
          this._projectName = name;
        } else {
          this.mergeTrees(this._rootDir, remoteProject);
          this.storage.saveProject(this._rootDir, this.projectName);
        }
      } else if (localProjectTree) {
        this._rootDir = localProjectTree;
        this._projectName = localProjectName ?? "";
      }

      this.loadPredicatesFromFile();
      this.loadVerifiersFromFile();
      this._dataChange.next(this._rootDir.contents);
    } catch (error) {
      console.error("Failed to download workspace:", error);
      throw error;
    }
  }

  private mergeTrees(local: ProjectDirectory, remote: ProjectDirectory) {
    for (const remoteElement of remote.contents) {
      const localElement = local.contents.find(
        (e) => e.urn === remoteElement.urn,
      );
      if (!localElement) {
        local.contents.push(remoteElement);
      } else if (
        localElement.type === "DIRECTORY" &&
        remoteElement.type === "DIRECTORY"
      ) {
        this.mergeTrees(
          localElement as ProjectDirectory,
          remoteElement as ProjectDirectory,
        );
      }
    }
  }

  /**
   * Create a project in the backend
   */
  public async createProject() {
    if (!this._projectName || this._projectName.trim() === "") {
      throw new Error("Project name cannot be empty");
    }
    await this.network.createProject(this._projectName);
    this.projectId = this.network.projectId!;
    return this.storage.setProjectId(this.projectId!);
  }

  private async uploadFolder(folder: ProjectDirectory) {
    console.log("upload folder", folder);
    for (const item of folder.contents) {
/*
      if (item.urn.startsWith(".internal")) {
        continue;
      }
*/

      if (item.serverSideUrn && item.serverSideUrn !== item.urn) {
        const inodeType = item.type === "DIRECTORY" ? "directory" : "file";
        const inode: Inode = {
          urn: item.serverSideUrn,
          inodeType: inodeType,
        };

        const remoteRoot = this.storage.getRemoteProjectTree();
        if (remoteRoot) {
          const remoteElement = this.findByUrn(item.serverSideUrn, remoteRoot);
          if (remoteElement && remoteElement.urn === item.serverSideUrn) {
            await this.network.deleteFile(inode);

            const parent = this.getParentDirectory(remoteElement, remoteRoot);
            if (parent) {
              parent.removeElement(remoteElement.name);
              console.log("removed from remote parent");
            }
          }
          this.storage.saveRemoteProject(remoteRoot, this.projectName);
        }
        item.serverSideUrn = undefined;
      }

      switch (item.type) {
        case "DIRECTORY":
          await this.uploadFolder(item as ProjectDirectory);
          continue;
        case "CODE_FILE":
        case "DIAGRAM_FILE": {
          const success = await this.network.uploadFile(
            this.mapper.exportFile(item),
          );
          if (success) {
            const remoteRoot = this.storage.getRemoteProjectTree();
            if (remoteRoot) {
              const remoteElement = this.findByUrn(item.urn, remoteRoot);
              if (remoteElement) {
                // This is a simplified update. A more robust implementation
                // would merge properties instead of overwriting.
                Object.assign(remoteElement, item);
              } else {
                // If the element doesn't exist in the remote tree, add it.
                const parent = this.getParentDirectory(item.urn);
                if (parent) {
                  const remoteParent = this.findByUrn(parent.urn, remoteRoot);
                  if (remoteParent && remoteParent.type === "DIRECTORY") {
                    (remoteParent as ProjectDirectory).contents.push(item);
                  }
                }
              }
              this.storage.saveRemoteProject(remoteRoot, this.projectName);
            }
          }
          break;
        }
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
    console.log("Move action requested (file, target):", file, target);
    const newParentPath = target.urn;
    const oldUrn = file.urn;

    if (!file.serverSideUrn) {
      const remoteTree = this.storage.getRemoteProjectTree();
      if (remoteTree) {
        const remoteElement = this.findByUrn(oldUrn, remoteTree);
        if (remoteElement) {
          file.serverSideUrn = oldUrn;
        }
      }
    }

    if (!(target instanceof ProjectDirectory)) {
      return false;
    }

    if (!target.addElement(file)) {
      return false;
    }

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
          if (
            child.serverSideUrn &&
            child.serverSideUrn.startsWith(oldPrefix)
          ) {
            child.serverSideUrn =
              newPrefix + child.serverSideUrn.substring(oldPrefix.length);
          }
        }
        if (child.type === "DIRECTORY") {
          (child as ProjectDirectory).contents.forEach(updateChild);
        }
      };

      dir.contents.forEach(updateChild);
    }

    const oldParent = this.getParentDirectory(oldUrn);
    if (oldParent) {
      oldParent.removeElement(file.name);
    }
    this.storage.saveProject(this._rootDir, this._projectName);
    this._dataChange.next(this._rootDir.contents);
    return true;
  }

  /**
   * Rename the element
   */
  public renameElement(element: ProjectElement, name: string) {
    const trimmedName = name.trim();

    if (trimmedName.includes("/")) {
      throw new Error("Element name contains forbidden character '/'");
    }
    if (trimmedName === "") {
      throw new Error("Element name cannot be empty");
    }

    const parentPath = element.parentPath;
    const oldUrn = element.urn;

    let newUrn: string;

    if (element.type === "DIRECTORY") {
      newUrn = parentPath ? parentPath + "/" + trimmedName : trimmedName;
    } else {
      // Files must always keep their canonical extension based on fileType.
      const dotIndex = trimmedName.lastIndexOf(".");
      const oldDotIndex = element.name.lastIndexOf(".");
      const baseName =
        dotIndex === -1 ? trimmedName : trimmedName.substring(0, dotIndex);
      if (oldDotIndex < 0) {
        throw new Error("Cannot rename file without a known fileType");
      }
      const fileType: string | undefined = element.name.substring(oldDotIndex);
      const canonicalExtension = fileType; // Creation uses `name + "." + type`, keep same convention.

      if (baseName === "") {
        throw new Error("Element name cannot be empty");
      }
      if (baseName.includes("/")) {
        throw new Error("Element name contains forbidden character '/'");
      }

      const newFileName = baseName + canonicalExtension;
      newUrn = parentPath ? parentPath + "/" + newFileName : newFileName;
    }

    if (newUrn.startsWith("/")) {
      newUrn = newUrn.substring(1);
    }
    element.urn = newUrn;

    console.log("server side urn:", element.serverSideUrn);
    if (!element.serverSideUrn) {
      element.serverSideUrn = oldUrn;
    }
    console.log(element.serverSideUrn);

    // If we're renaming a directory, recursively update all children URNs
    if (element.type === "DIRECTORY") {
      const dir = element as ProjectDirectory;
      const oldPrefix = oldUrn.endsWith("/") ? oldUrn : oldUrn + "/";
      const newPrefix = newUrn.endsWith("/") ? newUrn : newUrn + "/";

      const updateChild = (child: ProjectElement) => {
        if (child.urn.startsWith(oldPrefix)) {
          child.urn = newPrefix + child.urn.substring(oldPrefix.length);
          if (
            child.serverSideUrn &&
            child.serverSideUrn.startsWith(oldPrefix)
          ) {
            child.serverSideUrn =
              newPrefix + child.serverSideUrn.substring(oldPrefix.length);
          }
        }
        if (child.type === "DIRECTORY") {
          (child as ProjectDirectory).contents.forEach(updateChild);
        }
      };

      dir.contents.forEach(updateChild);
    }

    this.storage.saveProject(this._rootDir, this._projectName);
    console.log(this.storage.getProjectTree());
    this._dataChange.next(this._rootDir.contents);
  }

  private async loadPredicatesFromFile() {
    const predicatesFileUrn = ".internal/predicates.key";
    try {
      const content = await this.getFileContent(predicatesFileUrn);
      if (typeof content === "string") {
        const predicates = JSON.parse(content) as ProjectPredicate[];
        this.storage.setPredicates(predicates);
      }
    } catch (e) {
      console.log(
        "Predicates file not found or invalid, starting with empty predicates.",
      );
      this.storage.setPredicates([]);
    }
  }

  private async loadVerifiersFromFile() {
    const verifiersFileUrn = ".internal/verifiers.json";
    try {
      const content = await this.getFileContent(verifiersFileUrn);
      if (typeof content === "string") {
        const overrides = JSON.parse(content) as VerifierOverrides;
        this.storage.setVerifierOverrides(overrides);
        this._verifierOverridesLoaded.next();
      }
    } catch (e) {
      console.log(
        "Verifiers file not found or invalid, falling back to defaults.",
      );
    }
  }

  /**
   * Fires when the verifier overrides have just been hydrated from `.internal/verifiers.json`
   * (e.g. after `downloadWorkspace` or `importProject`). The {@link VerifierService}
   * subscribes to this to re-read the cache and refresh its signal so the UI updates.
   */
  public get verifierOverridesLoaded() {
    return this._verifierOverridesLoaded;
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

  public get projectName(): string {
    return this._projectName;
  }

  public set projectName(value: string) {
    this._projectName = value;
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
      projectName: this.projectName,
      rootDir: this._rootDir,
    };
  }
}
