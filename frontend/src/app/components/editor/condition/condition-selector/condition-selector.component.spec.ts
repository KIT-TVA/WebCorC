import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionSelectorComponent } from './condition-selector.component';

describe('ConditionSelectorComponent', () => {
  let component: ConditionSelectorComponent;
  let fixture: ComponentFixture<ConditionSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConditionSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
