import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitRefinementComponent } from './unit-refinement.component';

describe('UnitRefinementComponent', () => {
  let component: UnitRefinementComponent;
  let fixture: ComponentFixture<UnitRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnitRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
