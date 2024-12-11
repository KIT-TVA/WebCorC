import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportFileDialogComponent } from './import-file-dialog';

describe('ImportGraphDialogComponent', () => {
  let component: ImportFileDialogComponent;
  let fixture: ComponentFixture<ImportFileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportFileDialogComponent]
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
