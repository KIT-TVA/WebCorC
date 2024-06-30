import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepeatRefinementComponent } from './repeat-refinement.component';

describe('RepeatRefinementComponent', () => {
  let component: RepeatRefinementComponent;
  let fixture: ComponentFixture<RepeatRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepeatRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RepeatRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
