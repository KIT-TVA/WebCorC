import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/project/project.service';

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

  private _projectId : string | undefined
  
  public constructor(private route : ActivatedRoute, private projectService : ProjectService) {}
  
  public ngOnInit(): void {
    // read the query Params and setting them to the projectService
    this.route.queryParams
      .subscribe(params => {
        this.projectService.projectId = params['projectId']
        this._projectId = params['projectId']
      })
      
    if (this._projectId) {
      // if the projectId is not undefined load the project from the backend
      this.projectService.downloadWorkspace()
    }
  }

}
