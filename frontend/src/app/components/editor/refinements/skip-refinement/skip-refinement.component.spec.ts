import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkipRefinementComponent } from './skip-refinement.component';

describe('SkipRefinementComponent', () => {
  let component: SkipRefinementComponent;
  let fixture: ComponentFixture<SkipRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkipRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SkipRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
