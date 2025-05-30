import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadExampleDialogComponent } from './load-example-dialog.component';

describe('LoadExampleDialogComponent', () => {
  let component: LoadExampleDialogComponent;
  let fixture: ComponentFixture<LoadExampleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadExampleDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadExampleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
