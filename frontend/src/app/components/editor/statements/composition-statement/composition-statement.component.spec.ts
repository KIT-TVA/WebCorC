import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompositionStatementComponent } from './composition-statement.component';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('CompositionStatementComponent', () => {
  let component: CompositionStatementComponent;
  let fixture: ComponentFixture<CompositionStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompositionStatementComponent],
      providers: [provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompositionStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
