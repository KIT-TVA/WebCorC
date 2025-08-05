import { AfterViewInit, Component } from '@angular/core';

import { ProjectService } from '../../services/project/project.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-not-found-error-page',
    imports: [MatCardModule, MatIconModule],
    templateUrl: './not-found-error-page.component.html',
    styleUrl: './not-found-error-page.component.scss'
})
export class NotFoundErrorPageComponent implements AfterViewInit {


  private _message : string = "Not found"

  public constructor(private router : Router ,private projectService : ProjectService) {}
  
  
  public ngAfterViewInit(): void {
    
    const urlTree = this.router.parseUrl(this.router.url)

    const projectId = urlTree.queryParamMap.get("projectId")
    
    if (!projectId) {

      // Display Not defined Project
      this._message = "Project not defined"

      return
    }

    this._message = "Project defined, loading..."

    this.projectService.projectId = projectId

    this.projectService.dataChange.subscribe(() => {
      this.router.navigateByUrl(urlTree)
    })

    this.projectService.downloadWorkspace()


  }

  public get message() {
    return this._message
  }

}
