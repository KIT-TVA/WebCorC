import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenamingComponent } from './renaming.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('RenamingComponent', () => {
  let component: RenamingComponent;
  let fixture: ComponentFixture<RenamingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenamingComponent],
      providers: [provideHttpClient(),provideAnimations()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenamingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
