import { Component } from "@angular/core";

import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTreeModule } from "@angular/material/tree";
import { ProjectService } from "../../services/project/project.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Router } from "@angular/router";
import { first } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { CreateProjectDialogComponent } from "./create-project-dialog/create-project-dialog.component";
import {
  CodeFile,
  DiagramFile,
  ProjectDirectory,
  ProjectElement,
  ProjectFile,
  RenameProjectElement,
} from "../../services/project/types/project-elements";
import { ImportFileDialogComponent } from "./import-file-dialog/import-file-dialog";
import { MatMenuModule } from "@angular/material/menu";
import { ImportProjectDialogComponent } from "../landing-page/import-project-dialog/import-project-dialog.component";
import { Menubar } from "primeng/menubar";
import {
  MenuItem,
  MessageService,
  PrimeTemplate,
  TreeDragDropService,
  TreeNode,
} from "primeng/api";
import {
  Tree,
  TreeNodeCollapseEvent,
  TreeNodeDropEvent,
  TreeNodeExpandEvent,
} from "primeng/tree";
import { Button } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { FloatLabel } from "primeng/floatlabel";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { DialogService } from "primeng/dynamicdialog";
import { TreeService } from "../../services/tree/tree.service";
import { PredicateService } from "../../services/predicates/predicate.service";

/**
 * Component for the file management and navigating between the files,
 * Primarly interacts with the {@link ProjectService}, in which the state is stored
 */
@Component({
  selector: "app-project-explorer",
  imports: [
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    Menubar,
    Tree,
    PrimeTemplate,
    Button,
    InputText,
    FloatLabel,
    IconField,
    InputIcon,
  ],
  providers: [TreeDragDropService, DialogService],
  templateUrl: "./project-explorer.component.html",
  standalone: true,
  styleUrl: "./project-explorer.component.scss",
})
export class ProjectExplorerComponent {
  menuItems: MenuItem[] = [
    {
      label: "Save",
      icon: "pi pi-save",
      command: () => this.save(),
    },
    {
      label: "Add",
      icon: "pi pi-add",
      items: [
        {
          label: "Schema",
          icon: "pi pi-sitemap",
          command: () => this.addFileToRoot("schema", "diagram"),
        },
        {
          label: "Helper",
          icon: "pi pi-code",
          command: () => this.addFileToRoot("helper", "key"),
        },
        {
          label: "Code",
          icon: "pi pi-code",
          command: () => this.addFileToRoot("code", "java"),
        },
        {
          label: "New Directory",
          icon: "pi pi-folder-plus",
          command: () => this.addFolderToRoot("directory"),
        },
      ],
    },
    {
      label: "Import",
      icon: "pi pi-sign-in",
      items: [
        {
          label: "Import Project",
          icon: "pi pi-book",
          command: () => this.importProject(),
        },
        {
          label: "Import File",
          icon: "pi pi-file-import",
          command: () => this.import(),
        },
      ],
    },
    {
      label: "Export",
      icon: "pi pi-file-export",
      command: () => this.export(),
    },
  ];

  private expandedNodes: string[] = [];

  protected treeNodes: TreeNode[] = [];

  public constructor(
    public projectService: ProjectService,
    private router: Router,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private treeService: TreeService,
    private predicateService: PredicateService,
    private messageService: MessageService,
  ) {
    this.projectService.dataChange.subscribe((data) => {
      this.treeNodes = this.getTreeNodes(data);
    });
  }

  private getTreeNodes(content: ProjectElement[]): TreeNode<ProjectElement>[] {
    return content.map((element) => {
      let icon = "pi pi-file";
      let children: TreeNode<ProjectElement>[] = [];
      let pseudoElement = element;
      let type = "file";
      const expanded = this.expandedNodes.includes(element.path);
      if (element instanceof RenameProjectElement) {
        pseudoElement = element.element;
        type = "rename";
      } else if (element.name == "...new") {
        type = "fake";
      }
      if (pseudoElement instanceof ProjectDirectory) {
        icon = expanded ? "pi pi-folder-open" : "pi pi-folder";
        if (type != "rename") {
          type = "directory";
        }
        children = this.getTreeNodes(pseudoElement.content);
      }
      if (pseudoElement instanceof ProjectFile) {
        switch (pseudoElement.type) {
          case "diagram":
            icon = "pi pi-sitemap";
            break;
          case "java":
          case "key":
          default:
            icon = "pi pi-code";
        }
      }
      return {
        key: element.path,
        label: element.name,
        data: element,
        droppable: type == "directory",
        draggable: true,
        expanded: expanded,
        icon: icon,
        type: type,
        children: children,
        leaf: type != "directory",
      };
    });
  }

  /**
   * Add a new folder to the file tree
   * @param node The parent node
   * @param name The name of the new directory
   */
  public addFolder(node: ProjectElement, name: string) {
    if (!name) {
      return;
    }

    this.projectService.addDirectory(node.path, name);
  }

  public addFolderToRoot(name: string) {
    if (!name) {
      return;
    }

    this.projectService.addDirectory(this.projectService.root.path, name);
  }

  /**
   * Add a new file to the file tree
   * @param node The parent node
   * @param name The name of the new file
   * @param type The type of the new file
   * @returns
   */
  public addFile(node: ProjectElement, name: string, type: string) {
    if (!name) {
      return;
    }
    this.projectService.addFile(node.path, name, type);
  }

  public addFileToRoot(name: string, type: string) {
    if (!name) {
      return;
    }

    const baseFileName = `${name}.${type}`;

    // If there is no file with the same name, create it
    if (
      !this.projectService.root.content.some((pe) => pe.name === baseFileName)
    ) {
      this.projectService.addFile(this.projectService.root.path, name, type);
      return;
    }

    // Else create the file with the suffix name-i
    let i = 1;
    const existingNames = this.projectService.root.content.map((pe) => pe.name);

    // Keep incrementing until a unique name is found
    while (existingNames.includes(`${name}-${i}.${type}`)) {
      i++;
    }
    // Create the file with the next free suffix
    this.projectService.addFile(
      this.projectService.root.path,
      `${name}-${i}`,
      type,
    );
  }

  /**
   * Delete a project element based on the node selected by the user
   * @param node the node
   */
  public deleteElement(node: ProjectElement) {
    this.projectService.deleteElement(node.path, node.name);
  }

  /**
   * Add fake element to project tree
   * @param node the parent node of the new node
   */
  public addElement(node: ProjectElement) {
    this.projectService.addFakeElement(node.path);
  }

  /**
   * Open the files on clicking on them in the file tree in the corresponding editor
   * @param element The node to be opened
   */
  public navigate(element: ProjectElement) {
    if (!element) {
      return;
    }

    if (element instanceof CodeFile) {
      this.router.navigate(["editor/file/", element.path], {
        queryParamsHandling: "preserve",
      });
    }

    if (element instanceof DiagramFile) {
      this.router.navigate(["editor/diagram/", element.path], {
        queryParamsHandling: "preserve",
      });
    }
  }

  /**
   * Save the current state of the project to the backend.
   * If the projectId is not defined the user is asked to create a
   * new project
   */

  private openNewProjectDialog() {
    return this.dialogService.open(CreateProjectDialogComponent, {
      header: "Select Project",
      modal: true,
    });
  }

  /**
   * Import file with the given node as a parent
   * @param node the parent node of the new file
   */
  public importElement(node: ProjectElement) {
    const element = node;
    if (!element) {
      return;
    }
    const path = element.path;
    this.dialogService.open(ImportFileDialogComponent, {
      data: { parentURN: path },
      header: "Import File",
      modal: true,
    });
  }
  /**
   * Save the current state of the project to the backend.
   * If the projectId is not defined the user is asked to create a
   * new project
   */
  public save() {
    this.treeService.finalizeStatements();
    this.predicateService.exportPredicates();
    if (this.projectService.shouldCreateProject) {
      this.openNewProjectDialog()?.onClose.subscribe((created) => {
        if (created) {
          this.projectService.uploadWorkspace().then(() =>
            this.messageService.add({
              summary: "Save successful",
              severity: "success",
            }),
          );
        } else {
          this.messageService.add({
            summary: "Save cancelled",
            detail: "No project specified to save to",
            severity: "warn",
          });
        }
      });
    } else {
      this.projectService.uploadWorkspace().then(() =>
        this.messageService.add({
          summary: "Save successful",
          severity: "success",
        }),
      );
    }
  }

  /**
   * Import file with under the root node
   */
  public import() {
    this.dialogService.open(ImportFileDialogComponent, {
      data: { parentURN: "/" },
      header: "Import File",
      modal: true,
    });
  }

  /**
   * Todo: Rewrite Export with /export to allow the backend to handle the export
   */
  public export() {
    this.projectService.explorerNotify.pipe(first()).subscribe(() => {
      const structure = JSON.stringify(this.projectService.export(), null, 2);
      const blob = new Blob([structure], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = this.projectService.projectname + ".json";
      a.click();
      window.URL.revokeObjectURL(url);
    });
    this.projectService.notifyEditortoSave();
  }

  /**
   * On Dropping the project element
   * @param event event emitted on dropping the node
   */
  public dropNode(event: TreeNodeDropEvent) {
    const node = event.dragNode?.data;
    let target = event.dropNode?.data;
    if (!target) {
      target = this.projectService.root;
    }

    const gotmoved = this.projectService.moveElement(node, target);
    if (!gotmoved) {
      // Todo: rename the element to fix name collision
    }
  }

  // Todo: Fix User Interface to rename a element name
  public toggleRename(node: ProjectElement) {
    const element = node;
    if (!element) return;
    this.projectService.toggleRename(element);
  }

  /**
   * Rename element
   * @param node The node to rename
   * @param newName the new name of the node
   */
  public renameElement(node: ProjectElement, newName: string) {
    if (!newName) return;
    const element = node;
    if (!element) return;

    this.projectService.renameElement(element, newName);
  }

  public importProject() {
    this.dialogService.open(ImportProjectDialogComponent, {
      data: { parentURN: "/" },
      header: "Import Project",
      modal: true,
    });
  }

  setExpanded(event: TreeNodeExpandEvent) {
    this.expandedNodes.push(event.node.data.path);
    event.node.icon = "pi pi-folder-open";
  }

  setCollapsed(event: TreeNodeCollapseEvent) {
    this.expandedNodes = this.expandedNodes.filter(
      (node) => node != event.node.data.path,
    );
    event.node.icon = "pi pi-folder";
  }
}
