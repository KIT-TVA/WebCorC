import { Component, EventEmitter, Inject, Input, model, ModelSignal, Output } from "@angular/core";
import { Condition, ICondition } from "../../../../types/condition/condition";
import { AiChatService } from "../../../../services/ai-chat/ai-chat.service";
import { Textarea } from "primeng/textarea";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { FloatLabelModule } from "primeng/floatlabel";
import { GREEN_COLOURED_CONDITIONS, RED_COLOURED_CONDITIONS } from "../../editor.component";
import { $dt } from "@primeuix/themes";
import { FormsModule } from "@angular/forms";

/**
 * Editor in the statements for the {@link Condition}
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
  selector: "app-condition-editor",
  imports: [Textarea, IconField, InputIcon, FloatLabelModule, FormsModule],
  templateUrl: "./condition-editor.component.html",
  standalone: true,
  styleUrl: "./condition-editor.component.scss",
})
export class ConditionEditorComponent {
  /**
   * Condition to edit
   */
  public condition: ModelSignal<ICondition> = model.required<ICondition>();

  /**
   * Flag to allow editing the condition content
   */
  @Input() public placeholder: string = "Type here";
  @Input() public editable = true;
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
    if (!this.condition()?.condition) return;
    this._aiChatService.addCondition(this.condition()!);
  }

  protected readonly $dt = $dt;
}
