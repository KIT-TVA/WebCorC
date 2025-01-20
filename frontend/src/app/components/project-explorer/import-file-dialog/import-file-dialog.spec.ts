import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportFileDialogComponent } from './import-file-dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

describe('ImportFileDialogComponent', () => {
  let component: ImportFileDialogComponent;
  let fixture: ComponentFixture<ImportFileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportFileDialogComponent, MatDialogModule],
      providers: [provideAnimations(), provideHttpClient(), { provide : MAT_DIALOG_DATA, useValue : {} }]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportFileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
