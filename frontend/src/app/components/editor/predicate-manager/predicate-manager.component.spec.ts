import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredicateManagerComponent } from './predicate-manager.component';

describe('PredicateManagerComponent', () => {
  let component: PredicateManagerComponent;
  let fixture: ComponentFixture<PredicateManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredicateManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredicateManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
