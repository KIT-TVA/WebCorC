import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionEditorComponent } from './condition-editor.component';

describe('ConditionEditorComponent', () => {
  let component: ConditionEditorComponent;
  let fixture: ComponentFixture<ConditionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConditionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
