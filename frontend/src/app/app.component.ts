import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { TreeService } from "./services/tree/tree.service";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import {MatBadgeModule} from '@angular/material/badge';
import { ProjectExplorerComponent } from "./components/project-explorer/project-explorer.component";
import { MatIconModule } from '@angular/material/icon';
import { NuMonacoEditorModule } from '@ng-util/monaco-editor';
import { ConsoleComponent } from './components/console/console.component';
import { ProjectService } from './services/project/project.service';
import { NetworkTreeService } from './services/tree/network/network-tree.service';
import { CreateProjectDialogComponent } from './components/project-explorer/create-project-dialog/create-project-dialog.component';
import { first } from 'rxjs';
import { NetworkStatusService } from './services/networkStatus/network-status.service';
import { ConsoleService } from './services/console/console.service';
import { EditorService } from './services/editor/editor.service';
import { AiChatComponent } from "./components/ai-chat/ai-chat.component";
import { AiChatService } from './services/ai-chat/ai-chat.service';

/**
 * Top Component of this application, 
 * this component includes the top bar and the routing element.
 * In which the editors and landing page get rendered in.
 */
@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, MatToolbarModule, MatSidenavModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, ProjectExplorerComponent, MatIconModule, NuMonacoEditorModule, ConsoleComponent, MatProgressBarModule, MatBadgeModule, AiChatComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

  private _loadingState = false

  constructor(
    public treeService: TreeService,
    private networkTreeService : NetworkTreeService,
    private networkStatus : NetworkStatusService,
    private dialog: MatDialog,
    public projectService : ProjectService,
    private snackBar : MatSnackBar,
    private consoleService : ConsoleService,
    private editorService : EditorService,
    private aiChatService : AiChatService
  ) {

    this.networkStatus.status.subscribe((status) => {
      if (status != this._loadingState) {
        this._loadingState = status
      }
    })
  }

  /**
   * Triggered on pressing the verify Button in the Top Bar.
   * Sideeffect: When the helper.key exists and no backend project connected prompt user to create project in the backend.
   * This is needed for the backend to use the contents of helper.key
   */
  public verify(): void {
    if (this.projectService.findByPath('helper.key') && this.projectService.shouldCreateProject) {
      this.projectService.requestFinished.pipe(first()).subscribe(() => {

        this.projectService.editorNotify.pipe(first()).subscribe(() => {
          this.networkTreeService.verify(this.treeService.rootNode, this.treeService.variables, this.treeService.conditions, this.treeService.renaming ,this.projectService.projectId)
        })

        this.projectService.uploadWorkspace()
      })
      this.dialog.open(CreateProjectDialogComponent)
    } else {
      this.networkTreeService.verify(this.treeService.rootNode, this.treeService.variables, this.treeService.conditions, this.treeService.renaming ,this.projectService.projectId)
    }

  }

  /**
   * Triggered on pressing the generate Button in the Top Bar.
   * Sideeffect: When the helper.key exists and no backend project connected prompt user to create project in the backend.
   * This is needed for the backend to use the contents of helper.key
   */
  public generateCode() : void {
    if (this.projectService.findByPath('helper.key') && this.projectService.shouldCreateProject) {
      this.projectService.requestFinished.pipe(first()).subscribe(() => {

        this.projectService.editorNotify.pipe(first()).subscribe(() => {
          this.networkTreeService.generateCode(this.treeService.rootNode, this.treeService.variables, this.treeService.conditions, this.treeService.renaming, this.editorService.currentFileName ,this.projectService.projectId)
        })

        this.projectService.uploadWorkspace()
      })

      this.dialog.open(CreateProjectDialogComponent)
    } else {
      this.networkTreeService.generateCode(this.treeService.rootNode, this.treeService.variables, this.treeService.conditions, this.treeService.renaming, this.editorService.currentFileName ,this.projectService.projectId)
    }
  }

  private writeURLintoClipboard() {
    navigator.clipboard.writeText(window.origin + "?projectId=" + this.projectService.projectId)
    this.snackBar.open("Copied project url", "Dismiss", {
      horizontalPosition : "end",
      verticalPosition: "bottom",
      duration: 5000
    })
  }

  /**  
   * Write the url of the current project into the clipboard.
   * Sideeffect: When no project id defined create project and upload current content to backend.
   */
  public share() {
    let wait = false 
    if (this.projectService.shouldCreateProject) {
      this.projectService.requestFinished.pipe(first()).subscribe(() => {
        this.writeURLintoClipboard()
      })
      this.dialog.open(CreateProjectDialogComponent)
      wait = true 
    }

    if (!wait) {
      this.projectService.editorNotify.pipe(first()).subscribe(() => {
        this.writeURLintoClipboard()
      })
    }

    this.projectService.uploadWorkspace(wait)
  }


  public get consoleButtonColor() {
    return this.consoleService.numberOfLogs > 0 ? 'rgb(186, 26, 26)' : ''
  }

  public get aiButtonColor() {
    return this.aiChatService.newMessages ? 'rgb(186, 26, 26)' : ''
  }

  public getLoadingState() : "indeterminate" | "determinate" {
    return this._loadingState ? "indeterminate" : "determinate"
  }

  /**
   * Prevent closing the tab with not saved changes
   * @returns the permission to close the tab
   */
  @HostListener('window:beforeunload', ['$event'])
  public onClose() : boolean {
    this.projectService.editorNotify.next()
    if (this.projectService.isEmpty) {
      return true
    }
    
    

    if (confirm('Are you sure to want to leave this editor')) {
      return true 
    }

    return false 
  }
}
