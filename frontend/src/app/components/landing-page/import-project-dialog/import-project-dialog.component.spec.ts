import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportProjectDialogComponent } from './import-project-dialog.component';

describe('ImportProjectDialogComponent', () => {
  let component: ImportProjectDialogComponent;
  let fixture: ComponentFixture<ImportProjectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportProjectDialogComponent]
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
