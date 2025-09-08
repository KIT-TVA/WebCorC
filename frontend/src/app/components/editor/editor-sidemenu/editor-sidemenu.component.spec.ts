import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorSidemenuComponent } from './editor-sidemenu.component';

describe('EditorSidemenuComponent', () => {
  let component: EditorSidemenuComponent;
  let fixture: ComponentFixture<EditorSidemenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorSidemenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorSidemenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
