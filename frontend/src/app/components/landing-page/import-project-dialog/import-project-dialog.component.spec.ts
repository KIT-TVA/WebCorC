import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportProjectDialogComponent } from './import-project-dialog.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('ImportProjectDialogComponent', () => {
  let component: ImportProjectDialogComponent;
  let fixture: ComponentFixture<ImportProjectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportProjectDialogComponent],
      providers: [provideAnimations(),provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
