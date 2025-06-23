import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionEditorComponent } from './condition-editor.component';
import { Condition } from '../../../../types/condition/condition';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('ConditionEditorComponent', () => {
  let component: ConditionEditorComponent;
  let fixture: ComponentFixture<ConditionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionEditorComponent],
      providers: [provideHttpClient(),provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConditionEditorComponent);
    component = fixture.componentInstance;
    component.condition.set(new Condition(""))
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
