import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseRefinementComponent } from './case-refinement.component';

describe('CaseRefinementComponent', () => {
  let component: CaseRefinementComponent;
  let fixture: ComponentFixture<CaseRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
