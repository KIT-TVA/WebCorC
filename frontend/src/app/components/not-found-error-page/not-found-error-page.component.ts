import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project/project.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found-error-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './not-found-error-page.component.html',
  styleUrl: './not-found-error-page.component.scss'
})
export class NotFoundErrorPageComponent implements AfterViewInit {


  private _message : string = "Not found"

  constructor(private router : Router ,private projectService : ProjectService) {}
  
  
  ngAfterViewInit(): void {
    
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

  get message() {
    return this._message
  }

}
