import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepetitionStatementComponent } from './repetition-statement.component';

describe('RepetitionStatementComponent', () => {
  let component: RepetitionStatementComponent;
  let fixture: ComponentFixture<RepetitionStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepetitionStatementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RepetitionStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
