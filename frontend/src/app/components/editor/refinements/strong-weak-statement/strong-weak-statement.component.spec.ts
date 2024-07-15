import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrongWeakStatementComponent } from './strong-weak-statement.component';

describe('StrongWeakStatementComponent', () => {
  let component: StrongWeakStatementComponent;
  let fixture: ComponentFixture<StrongWeakStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrongWeakStatementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StrongWeakStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
