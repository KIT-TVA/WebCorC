import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorBottommenuComponent } from './editor-bottommenu.component';

describe('EditorBottommenuComponent', () => {
  let component: EditorBottommenuComponent;
  let fixture: ComponentFixture<EditorBottommenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorBottommenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorBottommenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
