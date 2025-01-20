import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideAnimations()]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent)
    fixture.autoDetectChanges()
    const component = fixture.componentInstance
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initalize with disabled generate content and verify buttons', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges()
    const compiled = fixture.nativeElement as HTMLElement
    expect(compiled.querySelector('mat-toolbar > button'))
  })
});
