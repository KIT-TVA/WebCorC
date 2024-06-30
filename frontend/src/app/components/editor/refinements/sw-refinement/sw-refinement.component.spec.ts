import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwRefinementComponent } from './sw-refinement.component';

describe('SwRefinementComponent', () => {
  let component: SwRefinementComponent;
  let fixture: ComponentFixture<SwRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SwRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
