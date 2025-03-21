import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrongWeakStatementComponent } from './strong-weak-statement.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('StrongWeakStatementComponent', () => {
  let component: StrongWeakStatementComponent;
  let fixture: ComponentFixture<StrongWeakStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrongWeakStatementComponent],
      providers: [provideHttpClient(),provideAnimations()]
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
