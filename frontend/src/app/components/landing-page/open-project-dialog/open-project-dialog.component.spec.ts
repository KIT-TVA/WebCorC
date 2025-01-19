import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenProjectDialogComponent } from './open-project-dialog.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('OpenProjectDialogComponent', () => {
  let component: OpenProjectDialogComponent;
  let fixture: ComponentFixture<OpenProjectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenProjectDialogComponent],
      providers: [provideAnimations(), provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
