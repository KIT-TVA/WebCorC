import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionStatementComponent } from './selection-statement.component';

describe('SelectionStatementComponent', () => {
  let component: SelectionStatementComponent;
  let fixture: ComponentFixture<SelectionStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionStatementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectionStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
