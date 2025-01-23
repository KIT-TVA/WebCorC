import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseRefinementComponent } from './choose-refinement.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

describe('ChooseRefinementComponent', () => {
  let component: ChooseRefinementComponent;
  let fixture: ComponentFixture<ChooseRefinementComponent>;

  let matDialogRef : MatDialogRef<ChooseRefinementComponent> 

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseRefinementComponent, MatDialogModule],
      providers: [
        provideAnimations()
      , {
        provide: MatDialogRef,
        useValue: {}
      }]
    })
    .compileComponents();

    matDialogRef = TestBed.inject(MatDialogRef<ChooseRefinementComponent>)
    
    fixture = TestBed.createComponent(ChooseRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
