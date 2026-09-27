import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Condition, } from '../../../../types/condition/condition';
import { FloatLabelModule } from 'primeng/floatlabel';
import { $dt } from '@primeuix/themes';
import { FormsModule } from '@angular/forms';
import { ILattice, ILatticeLevel } from '../../../../types/ifbc/lattice';
import { Select } from 'primeng/select';
import { VariableIFbCState } from '../../../../types/ifbc/variableState';

/**
 * Editor in the statements for the {@link Condition}
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
  selector: 'app-confidentiality-editor',
  imports: [FloatLabelModule, FormsModule, Select],
  templateUrl: './confidentiality-editor.component.html',
  standalone: true,
  styleUrl: './confidentiality-editor.component.css',
})
export class ConfidentialityEditorComponent {
  @Input() public variables!: VariableIFbCState;
  @Input() public confidentialityLattice!: ILattice;
  @Input() public integrityLattice!: ILattice;

  @Output() public variablesChange = new EventEmitter<void>();

  public constructor() {}

  public get conffidentialityLevels(): ILatticeLevel[] {
    return this.confidentialityLattice.levels
  }
  public get integrityLevels(): ILatticeLevel[] {
    return this.integrityLattice.levels
  }

  public get items(): { variable: string, confidentiality: ILatticeLevel, integrity: ILatticeLevel }[] {
    return Object.keys(this.variables.confidentiality).map((variable) => ({ variable, confidentiality: this.variables.confidentiality[variable], integrity: this.variables.integrity[variable] }))
  }

  public onVariableConfidentialityChanged(variable: string, level: ILatticeLevel): void {
    this.variables.confidentiality[variable] = level;
    this.variablesChange.emit();
  }

  public onVariableIntegrityChanged(variable: string, level: ILatticeLevel): void {
    this.variables.integrity[variable] = level;
    this.variablesChange.emit();
  }

  protected readonly $dt = $dt;
}
