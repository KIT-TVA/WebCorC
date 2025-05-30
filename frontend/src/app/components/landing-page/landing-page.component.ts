import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/project/project.service';
import { MatDialog } from '@angular/material/dialog';
import { OpenProjectDialogComponent } from './open-project-dialog/open-project-dialog.component';
import { ImportProjectDialogComponent } from './import-project-dialog/import-project-dialog.component';
import { LoadExampleDialogComponent } from './load-example-dialog/load-example-dialog.component';
import { ImportFileDialogComponent } from '../project-explorer/import-file-dialog/import-file-dialog';

/**
 * Landingpage infront of the editors to prevent file not found errors,
 * this component is mounted at the root / of the url path and so the default page for users
 * to see.
 */
@Component({
    selector: 'app-landing-page',
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './landing-page.component.html',
    styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {
  public constructor(
    private route : ActivatedRoute, 
    private projectService : ProjectService,
    private dialog : MatDialog
  ) {}
  
  public ngOnInit(): void {
    // read the query Params and setting them to the projectService
    this.route.queryParams
      .subscribe(params => {
        this.projectService.projectId = params['projectId']
      })
    
      // if the projectId is not undefined load the project from the backend
    this.projectService.downloadWorkspace()
  }

  public openProjectDialog() {
    this.dialog.open(OpenProjectDialogComponent)
  }

  public importProjectDialog() {
    this.dialog.open(ImportProjectDialogComponent)
  }

  public importFileDialog() {
    this.dialog.open(ImportFileDialogComponent, { data: { parentURN: "/" } })
  }

  public loadExampleDialog() {
    this.dialog.open(LoadExampleDialogComponent)
  }
}
