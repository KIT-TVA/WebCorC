import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormalParametersComponent } from './formal-parameters.component';

describe('FormalParametersComponent', () => {
  let component: FormalParametersComponent;
  let fixture: ComponentFixture<FormalParametersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormalParametersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormalParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
