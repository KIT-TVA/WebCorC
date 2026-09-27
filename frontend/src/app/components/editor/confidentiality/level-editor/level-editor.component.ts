import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Condition, } from '../../../../types/condition/condition';
import { FloatLabelModule } from 'primeng/floatlabel';
import { $dt } from '@primeuix/themes';
import { FormsModule } from '@angular/forms';
import { ILattice, ILatticeLevel } from '../../../../types/ifbc/lattice';
import { VariableIFbCState } from '../../../../types/ifbc/variableState';

/**
 * Editor in the statements for the {@link Condition}
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
  selector: 'level-editor',
  imports: [FloatLabelModule, FormsModule],
  templateUrl: './level-editor.component.html',
  standalone: true,
  styleUrl: './level-editor.component.css',
})
export class LevelEditorComponent {
  @Input({ required: true }) public variables!: { [variable: string]: ILatticeLevel };
  @Input({ required: true }) public lattice!: ILattice;
  @Input() public readonly: boolean = false;

  @Output() public variablesChange = new EventEmitter<VariableIFbCState>();

  public constructor() {}

  public get levels(): ILatticeLevel[] {
    return this.lattice.levels
  }

  public get items(): { variable: string, level: ILatticeLevel }[] {
    return Object.keys(this.variables).map((variable) => ({ variable, level: this.variables[variable] }))
  }

  public onVariableLevelChanged(variable: string, level: ILatticeLevel): void {
    this.variables[variable] = level
  }

  protected readonly $dt = $dt;
}
