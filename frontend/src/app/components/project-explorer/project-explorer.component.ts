import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule} from '@angular/material/tree';
import { ProjectService } from '../../services/project/project.service';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';
import { ProjectElement, ProjectDirectory, CodeFile, DiagramFile, RenameProjectElement } from '../../services/project/types/project-elements';
import { ImportFileDialogComponent } from './import-file-dialog/import-file-dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ImportProjectDialogComponent } from '../landing-page/import-project-dialog/import-project-dialog.component';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';

class FlatNode {
  expandable: boolean;
  name : string
  path : string
  level : number
  getsRenamed : boolean

  constructor(node : ProjectElement, level : number) {
    this.level = level
    this.name = node.name
    this.path = node.path
    this.expandable = node instanceof ProjectDirectory
    this.getsRenamed = node.getsRenamed
  }
}
/**
 * Component for the file management and navigating between the files,
 * Primarly interacts with the {@link ProjectService}, in which the state is stored
 */
@Component({
    selector: 'app-project-explorer',
    imports: [CommonModule, MatTreeModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatMenuModule, CdkDrag, CdkDropList],
    templateUrl: './project-explorer.component.html',
    styleUrl: './project-explorer.component.scss'
})
export class ProjectExplorerComponent {

  // convert the project elements to the flatnode
  private _transformer = (element : ProjectElement, level : number) : FlatNode => {
    const existingNode = this.elementToNodeMap.get(element);
    const flatNode = existingNode && existingNode.path === element.path ? existingNode : new FlatNode(element, level);
    this.elementToNodeMap.set(element, flatNode);
    this.nodeToElementMap.set(flatNode, element);
    return flatNode
  }


  private elementToNodeMap : Map<ProjectElement, FlatNode> = new Map<ProjectElement, FlatNode>();
  private nodeToElementMap : Map<FlatNode, ProjectElement> = new Map<FlatNode, ProjectElement>();
  private _treeFlatener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => (node as ProjectDirectory).content)

  private _treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);

  private _dataSource = new MatTreeFlatDataSource(this.treeControl, this._treeFlatener);

  private _dragging : boolean = false


  public constructor(public projectService : ProjectService, private router : Router, private dialog : MatDialog) {
    this.dataSource.data = this.projectService.root.content;

    this.projectService.dataChange.subscribe((data) => {
      this.dataSource.data = data
    })
  }

  /**
   * Add a new folder to the file tree
   * @param node The parent node 
   * @param name The name of the new directory
   */
  public addFolder(node : FlatNode, name : string) {

    if (!name) {
      return;
    }

    this.projectService.addDirectory(node.path, name)
    this.treeControl.expand(node)
  }

  /**
   * Add a new file to the file tree
   * @param node The parent node
   * @param name The name of the new file
   * @param type The type of the new file
   * @returns 
   */
  public addFile(node : FlatNode, name : string, type : string) {
    
    if (!name) {
      return;
    }

    const parent = this.nodeToElementMap.get(node)
    if (!parent) {
      return;
    }

    this.projectService.addFile(node.path, name, type)
    this.treeControl.expand(node)
  }



  public deleteElement(node : FlatNode) {
    this.projectService.deleteElement(node.path, node.name)
  }


  public addElement(node : FlatNode) {
    this.projectService.addFakeElement(node.path)
    this.treeControl.expand(node)
  }


  /**
   * Open the files on clicking on them in the file tree in the corresponding editor
   * @param node The node to be opened
   */
  public navigate(node : FlatNode) {
    const element = this.nodeToElementMap.get(node) 
    if (!element) {
      return
    }

    if (element instanceof CodeFile) {
      this.router.navigate(
        ['editor/file/', element.path],
        { queryParamsHandling: 'preserve' }
      )
    }

    if (element instanceof DiagramFile) {
      this.router.navigate(
        ['editor/diagram/', element.path],
        { queryParamsHandling: 'preserve' }
      )
    }
  }

  /**
   * Save the current state of the project to the backend.
   * If the projectId is not defined the user is asked to create a
   * new project
   */
  public save() {
    let wait = false
    if (this.projectService.shouldCreateProject)  {
      this.dialog.open(CreateProjectDialogComponent)
      wait = true
    }
    this.projectService.uploadWorkspace(wait)
  }

  public importElement(node : FlatNode) {
    const element = this.nodeToElementMap.get(node)
    if (!element) {
      return
    }
    const path = element.path
    this.dialog.open(ImportFileDialogComponent, { data: { parentURN: path } })
  }

  public import() {
    this.dialog.open(ImportFileDialogComponent, { data: { parentURN: "/" }})
  }

  /**
   * Todo: Rewrite Export with /export to allow the backend to handle the export
   */
  public export() {
    this.projectService.explorerNotify.pipe(first()).subscribe(() => {
      const structure = JSON.stringify(this.projectService.export(), null, 2);
      const blob = new Blob([structure], {type: "application/json"});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = this.projectService.projectname + ".json";
      a.click();
      window.URL.revokeObjectURL(url);
    })
    this.projectService.notifyEditortoSave()
  }

  public dragStart() {
    this._dragging = true
  }

  public dragEnd() {
    this._dragging = false
  }

  public dragHover(node : FlatNode) {
    if (!this._dragging) return

    this._treeControl.expand(node)
  }

  public dropNode(event : CdkDragDrop<string[]>) {
    if (!event.isPointerOverContainer) return;

    const node = this.nodeToElementMap.get(event.item.data)
    if (!node) return


    let target = this.dataSource.data[event.currentIndex - 1] 
    if (event.currentIndex < 0) {
      target = this._dataSource.data[0]
    } else if (event.currentIndex >= this._dataSource.data.length) {
      target = this.projectService.root
    }

    const gotmoved = this.projectService.moveElement(node, target)
    
    if (!gotmoved) {
      // Todo: rename the element to fix name collision 
    }
  }

  // Todo: Fix User Interface to rename a element name
  public toggleRename(node : FlatNode) {
    
    const element = this.nodeToElementMap.get(node)
    if (!element) return
    
    this.projectService.toggleRename(element)
  }

  public renameElement(node : FlatNode, newName : string) {
    if (!newName) return

    const element = this.nodeToElementMap.get(node)
    if (!element) return

    this.projectService.renameElement(element, newName)
  }


  public createHelperFile() {
    this.projectService.addFile("/", "helper", "key")
  }

  public importProject() {
    this.dialog.open(ImportProjectDialogComponent)
  }

  public getRenameName(node : FlatNode) {
    return (this.nodeToElementMap.get(node) as RenameProjectElement).elementName
  }

  // identify the directories for the html template
  hasChild = (_: number, node: FlatNode) => node.expandable && !node.getsRenamed;

  // identify the fakeProjectElement for the html template
  isTypeLessAndHasNoName = (_ : number, node : FlatNode) => node.name === this.projectService.fakeElementName && !node.getsRenamed;

  public getsRenamed(_ : number, node : FlatNode) {
    return node.getsRenamed
  }

  public get root() {
    return new FlatNode(this.projectService.root, -1)
  }

  public get treeControl() {
    return this._treeControl;
  }

  public set treeControl(value) {
    this._treeControl = value;
  }

  public get dataSource() {
    return this._dataSource;
  }

  public set dataSource(value) {
    this._dataSource = value;
  }
}
