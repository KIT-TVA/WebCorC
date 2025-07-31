import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RootStatementComponent } from './root-statement.component';

describe('RootStatementComponent', () => {
  let component: RootStatementComponent;
  let fixture: ComponentFixture<RootStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RootStatementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RootStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
