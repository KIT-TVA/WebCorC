import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalConditionsComponent } from './global-conditions.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('GlobalConditionsComponent', () => {
  let component: GlobalConditionsComponent;
  let fixture: ComponentFixture<GlobalConditionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalConditionsComponent],
      providers: [provideHttpClient(),provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GlobalConditionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
