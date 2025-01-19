import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportFileDialogComponent } from './import-file-dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('ImportFileDialogComponent', () => {
  let component: ImportFileDialogComponent;
  let fixture: ComponentFixture<ImportFileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportFileDialogComponent],
      providers: [provideAnimations(), provideHttpClient()]
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
