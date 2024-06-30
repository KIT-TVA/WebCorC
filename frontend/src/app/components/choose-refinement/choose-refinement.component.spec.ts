import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseRefinementComponent } from './choose-refinement.component';

describe('ChooseRefinementComponent', () => {
  let component: ChooseRefinementComponent;
  let fixture: ComponentFixture<ChooseRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChooseRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
