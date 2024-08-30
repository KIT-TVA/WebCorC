import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../services/project/project.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {

  private _projectId : string | undefined
  
  constructor(private route : ActivatedRoute, private projectService : ProjectService) {

  }
  
  
  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {

        this._projectId = params['projectId']
      })
      
    if (this._projectId) {
      // load project from backend
    }
  }

}
