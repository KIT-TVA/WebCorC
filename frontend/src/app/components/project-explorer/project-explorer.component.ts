import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule} from '@angular/material/tree';
import { ProjectService } from '../../services/project/project.service';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ProjectElement } from '../../services/project/project-element';
import { CodeFile, DiagramFile } from '../../services/project/project-files';
import { ProjectDirectory } from '../../services/project/project-directory';
import { MatFormFieldModule } from '@angular/material/form-field';
import { fakeProjectElementName } from '../../services/project/fake-element';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';

class FlatNode {
  expandable: boolean;
  name : string;
  path : string;
  level : number;

  constructor(node : ProjectElement, level : number) {
    this.level = level
    this.name = node.name
    this.path = node.path
    this.expandable = node instanceof ProjectDirectory
  }
}
/**
 * Component for the file management and navigating between the files,
 * Primarly interacts with the @see ProjectService, in which the state is stored
 */
@Component({
  selector: 'app-project-explorer',
  standalone: true,
  imports: [CommonModule, MatTreeModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './project-explorer.component.html',
  styleUrl: './project-explorer.component.scss'
})
export class ProjectExplorerComponent {

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

  private _dataSource = new MatTreeFlatDataSource(this.treeControl, this._treeFlatener

  );


  constructor(public projectService : ProjectService, private router : Router, private dialog : MatDialog) {
    this.dataSource.data = this.projectService.root.content;

    this.projectService.dataChange.subscribe((data) => {
      this.dataSource.data = data
    })
  }

  public addFolder(node : FlatNode, name : string) {

    if (!name) {
      return;
    }

    this.projectService.addDirectory(node.path, name)
    this.treeControl.expand(node)
  }

  public addFile(node : FlatNode, name : string, type : string) {
    
    if (!name) {
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

  public navigate(node : FlatNode) {
    const element = this.nodeToElementMap.get(node) 
    if (!element) {
      return
    }
 
    if (element instanceof CodeFile) {
      this.router.navigate(
        ['editor/file/', element.path],
      )
    }

    if (element instanceof DiagramFile) {
      this.router.navigate(
        ['editor/diagram/', element.path],
      )
    }
  }

  public save() {

    let wait = false
    if (this.projectService.shouldCreateProject)  {
      this.dialog.open(CreateProjectDialogComponent)
      wait = true
    }
    
    this.projectService.uploadWorkspace(wait)
  }

  public import() {
    
  }

  public export() {
    this.projectService.explorerNotify.pipe(first()).subscribe(() => {
      const structure = JSON.stringify(this.projectService.root.export(), null, 2);
      const blob = new Blob([structure], {type: "application/json"});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "program.json";
      a.click();
      window.URL.revokeObjectURL(url);
    })
    this.projectService.notifyEditortoSave()
  }

  hasChild = (_: number, node: FlatNode) => node.expandable;

  isTypeLessAndHasNoName = (_ : number, node : FlatNode) => node.name === fakeProjectElementName;

  get root() {
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
