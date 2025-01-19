import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateProjectDialogComponent } from './create-project-dialog.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('CreateProjectDialogComponent', () => {
  let component: CreateProjectDialogComponent;
  let fixture: ComponentFixture<CreateProjectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateProjectDialogComponent],
      providers: [provideAnimations(), provideHttpClient()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
