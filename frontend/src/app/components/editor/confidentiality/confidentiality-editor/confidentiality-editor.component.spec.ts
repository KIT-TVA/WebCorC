import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfidentialityEditorComponent } from './confidentiality-editor.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { defaultConfidentialityLattice, defaultIntegrityLattice } from '../../../../types/ifbc/lattice';

describe('ConditionEditorComponent', () => {
  let component: ConfidentialityEditorComponent;
  let fixture: ComponentFixture<ConfidentialityEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfidentialityEditorComponent],
      providers: [provideHttpClient(),provideAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfidentialityEditorComponent);
    component = fixture.componentInstance;
    component.variables = { 
      confidentiality: { 'i': defaultConfidentialityLattice.minimalLevel },
      integrity: { 'i': defaultIntegrityLattice.minimalLevel }
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
