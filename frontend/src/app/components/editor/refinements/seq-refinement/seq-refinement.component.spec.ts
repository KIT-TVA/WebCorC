import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeqRefinementComponent } from './seq-refinement.component';

describe('SeqRefinementComponent', () => {
  let component: SeqRefinementComponent;
  let fixture: ComponentFixture<SeqRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeqRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeqRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
