import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TreeService } from '../../../services/tree/tree.service';
import { ProjectService } from '../../../services/project/project.service';
import { first } from 'rxjs';
import { EditorService } from '../../../services/editor/editor.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss'
})
export class OptionsComponent {

  constructor(
    private treeService : TreeService, 
    private projectService : ProjectService,
    private editorService : EditorService,
  ){}


  public resetPositions() {
    this.treeService.resetPositions()

    this.projectService.explorerNotify.pipe(first()).subscribe(() => {
      this.editorService.reload.next()
    })

    this.projectService.editorNotify.next()
  }

  public exportGraph() {
    this.treeService.export()
  }

  public importGraph() {
    
  }

}
