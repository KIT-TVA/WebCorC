import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Condition } from '../../../../types/condition/condition';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { defaultConfidentialityLattice } from '../../../../types/ifbc/lattice';
import { LevelEditorComponent } from './level-editor.component';

describe('ConditionEditorComponent', () => {
  let component: LevelEditorComponent;
  let fixture: ComponentFixture<LevelEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelEditorComponent],
      providers: [provideHttpClient(),provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LevelEditorComponent);
    component = fixture.componentInstance;
    component.variables = { 'i': defaultConfidentialityLattice.levelById(0) }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
