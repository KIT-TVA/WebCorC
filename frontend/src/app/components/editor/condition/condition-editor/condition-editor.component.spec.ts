import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionEditorComponent } from './condition-editor.component';
import { Condition } from '../../../../types/condition/condition';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('ConditionEditorComponent', () => {
  let component: ConditionEditorComponent;
  let fixture: ComponentFixture<ConditionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionEditorComponent],
      providers: [provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConditionEditorComponent);
    component = fixture.componentInstance;
    component.condition = new Condition(1)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
