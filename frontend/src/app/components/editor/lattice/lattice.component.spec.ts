import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LatticeComponent } from './lattice.component';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('LatticeComponent', () => {
  let component: LatticeComponent;
  let fixture: ComponentFixture<LatticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LatticeComponent],
      providers: [provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LatticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
