import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenProjectDialogComponent } from './open-project-dialog.component';

describe('OpenProjectDialogComponent', () => {
  let component: OpenProjectDialogComponent;
  let fixture: ComponentFixture<OpenProjectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenProjectDialogComponent]
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
