import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalConditionsComponent } from './global-conditions.component';

describe('GlobalConditionsComponent', () => {
  let component: GlobalConditionsComponent;
  let fixture: ComponentFixture<GlobalConditionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalConditionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GlobalConditionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
