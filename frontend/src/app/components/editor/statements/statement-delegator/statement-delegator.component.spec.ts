import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementDelegatorComponent } from './statement-delegator.component';

describe('StatementDelegatorComponent', () => {
  let component: StatementDelegatorComponent;
  let fixture: ComponentFixture<StatementDelegatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatementDelegatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatementDelegatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
