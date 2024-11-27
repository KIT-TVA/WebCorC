import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TreeService } from "./services/tree/tree.service";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { CodegenComponent } from "./dialogs/codegen.component";
import { ProjectExplorerComponent } from "./components/project-explorer/project-explorer.component";
import { MatIconModule } from '@angular/material/icon';
import { NuMonacoEditorModule } from '@ng-util/monaco-editor';
import { ConsoleComponent } from './components/console/console.component';
import { ProjectService } from './services/project/project.service';
import { NetworkTreeService } from './services/tree/network/network-tree.service';
import { CreateProjectDialogComponent } from './components/project-explorer/create-project-dialog/create-project-dialog.component';
import { first } from 'rxjs';

/**
 * Top Component of this application, 
 * this component includes the top bar and the routing element.
 * In which the editors and landing page get rendered in.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, MatSidenavModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, ProjectExplorerComponent, MatIconModule, NuMonacoEditorModule, ConsoleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(
    public treeService: TreeService,
    private networkTreeService : NetworkTreeService,
    private dialog: MatDialog,
    public projectService : ProjectService,
    private snackBar : MatSnackBar
  ) {}

  verify(): void {
    this.networkTreeService.verify(this.treeService.rootNode, this.treeService.variables, this.treeService.conditions)
  }

  openGenerateCodeDialog(): void {
    this.dialog.open(CodegenComponent, {minWidth: "350px", height: "300px"});
  }

  export(): void {
    this.treeService.downloadJSON();
  }

  /**  
   * Write the url of the current project into the clipboard 
   */
  public share() {
    let wait = false 
    if (this.projectService.shouldCreateProject) {
      this.dialog.open(CreateProjectDialogComponent)
      wait = true 
    }

    this.projectService.uploadWorkspace(wait)

    this.projectService.editorNotify.pipe(first()).subscribe(() => {
      navigator.clipboard.writeText(window.location.protocol + "//" +window.location.hostname + ":" + window.location.port + "?projectId=" + this.projectService.projectId)
      this.snackBar.open("Copied project url", "Dismiss", {
        horizontalPosition : "end",
        verticalPosition: "bottom",
        duration: 5000
      })
    })
  }

  /**
   * Prevent closing the tab with not saved changes
   * @returns the permission to close the tab
   */
  @HostListener('window:beforeunload', ['$event'])
  onClose() : boolean {
    if (this.projectService.isEmpty) {
      return true
    }
    

    if (confirm('Are you sure to want to leave this editor')) {
      return true 
    }

    return false 
  }
}
