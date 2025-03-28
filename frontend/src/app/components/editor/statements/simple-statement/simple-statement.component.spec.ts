import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleStatementComponent } from './simple-statement.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('SimpleStatementComponent', () => {
  let component: SimpleStatementComponent;
  let fixture: ComponentFixture<SimpleStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleStatementComponent],
      providers: [provideHttpClient(),provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SimpleStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
