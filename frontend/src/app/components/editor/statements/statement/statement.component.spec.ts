import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementComponent } from './statement.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SimpleStatementComponent } from '../simple-statement/simple-statement.component';
import { provideHttpClient } from '@angular/common/http';

describe('StatementComponent', () => {
  let component: StatementComponent;
  let fixture: ComponentFixture<StatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatementComponent],
      providers: [provideHttpClient(),provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatementComponent);
    component = fixture.componentInstance;
    component.refinement = TestBed.createComponent(SimpleStatementComponent).componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
