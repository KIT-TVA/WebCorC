import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitRefinementComponent } from './init-refinement.component';

describe('InitRefinementComponent', () => {
  let component: InitRefinementComponent;
  let fixture: ComponentFixture<InitRefinementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InitRefinementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InitRefinementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
