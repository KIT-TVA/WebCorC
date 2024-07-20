import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule} from '@angular/material/tree';
import { ProjectService } from '../../services/project/project.service';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ProjectElement } from '../../services/project/project-element';
import { ProjectFile } from '../../services/project/project-file';
import { ProjectDirectory } from '../../services/project/project-directory';
import { BehaviorSubject } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { fakeProjectElementName } from '../../services/project/fake-element';
import { MatInputModule } from '@angular/material/input';

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
  private treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => (node as ProjectDirectory).content)

  treeControl = new FlatTreeControl<FlatNode> ( node => node.level, node => node.expandable)
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener)

  private dataChangeSubject : BehaviorSubject<ProjectElement[]> = new BehaviorSubject<ProjectElement[]>([]);

  constructor(private projectService : ProjectService) {
    this.dataSource.data = this.projectService.root.content;

    this.projectService.dataChange.subscribe((data) => {
      this.dataSource.data = data
    })
  }

  addFolder(node : FlatNode, name : string) {

    if (!name) {
      return;
    }

    this.projectService.addDirectory(node.path, name)
    this.treeControl.expand(node)
  }

  addFile(node : FlatNode, name : string) {
    
    if (!name) {
      return;
    }

    this.projectService.addFile(node.path, name)
    this.treeControl.expand(node)
  }

  deleteElement(node : FlatNode) {
    console.log(node)
    this.projectService.deleteElement(node.path, node.name)
  }

  addElement(node : FlatNode) {
    this.projectService.addElement(node.path)
    this.treeControl.expand(node)
  }

  hasChild = (_: number, node: FlatNode) => node.expandable;

  isTypeLessAndHasNoName = (_ : number, node : FlatNode) => node.name === fakeProjectElementName;

  get root() {
    return new FlatNode(this.projectService.root, -1)
  }

}
