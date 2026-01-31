import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { Condition, ICondition } from '../../../../types/condition/condition';
import { AiChatService } from '../../../../services/ai-chat/ai-chat.service';
import { Textarea } from 'primeng/textarea';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import {
  GREEN_COLOURED_CONDITIONS,
  RED_COLOURED_CONDITIONS,
} from '../../editor.component';
import { $dt } from '@primeuix/themes';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';

/**
 * Editor in the statements for the {@link Condition}
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
  selector: 'app-condition-editor',
  imports: [Textarea, IconField, InputIcon, FloatLabelModule, FormsModule, AsyncPipe],
  templateUrl: './condition-editor.component.html',
  standalone: true,
  styleUrl: './condition-editor.component.scss',
})
export class ConditionEditorComponent {
  /**
   * Condition to edit
   */
  @Input() public condition!: BehaviorSubject<ICondition>;

  /**
   * Flag to allow editing the condition content
   */
  @Input() public placeholder: string = 'Type here';
  @Input() public editable: boolean | null = true;
  @Input() public inline = false;

  /**
   * Emitter to emit the condition
   */
  @Output() public conditionEditingFinished: EventEmitter<void> =
    new EventEmitter<void>();

  public constructor(
    private _aiChatService: AiChatService,
    @Inject(GREEN_COLOURED_CONDITIONS) protected greenConditions: ICondition[],
    @Inject(RED_COLOURED_CONDITIONS) protected redConditions: ICondition[],
  ) {}

  /**
   * Function for sending the condition content to the ai chat
   * @see AiChatService
   */
  public askAi(): void {
    const currentCondition = this.condition.getValue();
    if (!currentCondition?.condition) return;
    this._aiChatService.addCondition(currentCondition);
  }

  public onConditionChange(newConditionString: string): void {
    const currentCondition = this.condition.getValue();
    // Create a new condition object or update existing one?
    // Assuming we should update the existing one or create a new one if it doesn't exist.
    // However, since we are passing ICondition objects around, let's update the property.
    // But to trigger updates properly with BehaviorSubject, we might want to emit a new object reference if immutability is desired.
    // Based on previous code: this.condition.condition = event; this.conditionChange.emit(this.condition);
    // It seems mutation was used.
    
    if (currentCondition) {
        currentCondition.condition = newConditionString;
        this.condition.next(currentCondition);
    } else {
        // Should not happen if initialized correctly, but as a fallback
        this.condition.next(new Condition(newConditionString));
    }
  }

  protected readonly $dt = $dt;
}
