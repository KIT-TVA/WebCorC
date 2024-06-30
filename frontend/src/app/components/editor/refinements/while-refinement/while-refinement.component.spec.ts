import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhileRefinementComponent } from './while-refinement.component';

describe('WhileRefinementComponent', () => {
  let component: WhileRefinementComponent;
  let fixture: ComponentFixture<WhileRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhileRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WhileRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
