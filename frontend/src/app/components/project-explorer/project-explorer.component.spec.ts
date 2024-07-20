import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectExplorerComponent } from './project-explorer.component';

describe('ProjectExplorerComponent', () => {
  let component: ProjectExplorerComponent;
  let fixture: ComponentFixture<ProjectExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectExplorerComponent]
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
