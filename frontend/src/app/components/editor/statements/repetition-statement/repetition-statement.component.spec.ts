import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepetitionStatementComponent } from './repetition-statement.component';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('RepetitionStatementComponent', () => {
  let component: RepetitionStatementComponent;
  let fixture: ComponentFixture<RepetitionStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepetitionStatementComponent],
      providers: [provideAnimations()]
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
