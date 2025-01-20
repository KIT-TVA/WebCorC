import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectExplorerComponent } from './project-explorer.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('ProjectExplorerComponent', () => {
  let component: ProjectExplorerComponent;
  let fixture: ComponentFixture<ProjectExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectExplorerComponent],
      providers: [provideAnimations(), provideHttpClient()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
