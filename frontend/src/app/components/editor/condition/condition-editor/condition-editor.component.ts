import {
  Component,
  DoCheck,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
  signal,
} from "@angular/core";
import { Condition, ICondition } from "../../../../types/condition/condition";
import { checkJmlSyntax } from "../../../../types/condition/jml-syntax-checker";
import { AiChatService } from "../../../../services/ai-chat/ai-chat.service";
import { Textarea } from "primeng/textarea";
import { FloatLabelModule } from "primeng/floatlabel";
import {
  GREEN_COLOURED_CONDITIONS,
  RED_COLOURED_CONDITIONS,
} from "../../editor.component";
import { $dt } from "@primeuix/themes";
import { FormsModule } from "@angular/forms";
import { BehaviorSubject, Subject, filter } from "rxjs";
import { AsyncPipe } from "@angular/common";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";

export const SYNTAX_CHECK_DELAY_MS = 2000;

class ConditionSyntaxCheck {
  public readonly error = signal<string | null>(null);
  private timeout?: ReturnType<typeof setTimeout>;

  constructor(private readonly isEnabled: () => boolean) {}

  public checkNow(text: string | undefined): void {
    this.cancel();
    this.error.set(this.findError(text));
  }

  public checkDelayed(text: string | undefined): void {
    this.cancel();
    const error = this.findError(text);
    if (error === null) {
      this.error.set(null);
    } else {
      this.timeout = setTimeout(
        () => this.error.set(error),
        SYNTAX_CHECK_DELAY_MS,
      );
    }
  }

  public cancel(): void {
    clearTimeout(this.timeout);
  }

  private findError(text: string | undefined): string | null {
    if (!this.isEnabled() || !text) {
      return null;
    }
    return checkJmlSyntax(text)?.message ?? null;
  }
}

/**
 * Editor in the statements for the {@link Condition}
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
    selector: 'app-condition-editor',
    imports: [Textarea, FloatLabelModule, FormsModule, AsyncPipe, Button, Dialog],
    templateUrl: './condition-editor.component.html',
    standalone: true,
    styleUrl: './condition-editor.component.css',
})
export class ConditionEditorComponent implements OnChanges, DoCheck, OnDestroy {
  private static nextId = 0;
  private static readonly checkNowRequests = new Subject<ICondition>();

  private _aiChatService = inject(AiChatService);
  protected greenConditions = inject(GREEN_COLOURED_CONDITIONS);
  protected redConditions = inject(RED_COLOURED_CONDITIONS);

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
    @Input() public showAiButton = false;
    @Input() public validateJml = true;

    /**
     * Emitter to emit the condition
     */
    @Output() public conditionEditingFinished: EventEmitter<void> =
        new EventEmitter<void>();
    @Output() public textChanged: EventEmitter<void> = new EventEmitter<void>();
    @Output() public synthesizeRequested: EventEmitter<void> = new EventEmitter<void>();
    protected dialogConditionText: string = "";

  protected readonly syntaxCheck = new ConditionSyntaxCheck(
    () => this.validateJml,
  );
  protected readonly dialogSyntaxCheck = new ConditionSyntaxCheck(
    () => this.validateJml,
  );
  protected readonly syntaxErrorId = `condition-syntax-error-${ConditionEditorComponent.nextId++}`;
  private checkedText?: string;
  private readonly checkNowSubscription = ConditionEditorComponent.checkNowRequests
    .pipe(filter((condition) => condition === this.condition?.getValue()))
    .subscribe(() => this.checkSyntaxNow());

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  public constructor() {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes["condition"] || changes["validateJml"]) {
      this.checkSyntaxNow();
    }
  }

  public ngDoCheck(): void {
    const text = this.condition?.getValue()?.condition;
    if (text !== this.checkedText) {
      this.checkedText = text;
      this.syntaxCheck.checkDelayed(text);
    }
  }

  public ngOnDestroy(): void {
    this.checkNowSubscription.unsubscribe();
    this.syntaxCheck.cancel();
    this.dialogSyntaxCheck.cancel();
  }

  private checkSyntaxNow(): void {
    this.checkedText = this.condition?.getValue()?.condition;
    this.syntaxCheck.checkNow(this.checkedText);
  }

  protected onEditingFinished(): void {
    ConditionEditorComponent.checkNowRequests.next(this.condition.getValue());
    this.conditionEditingFinished.emit();
  }

  /**
   * Function for sending the condition content to the ai chat
   * @see AiChatService
   */
  public askAi(): void {
    const currentCondition = this.condition.getValue();
    if (!currentCondition?.condition) return;
    this._aiChatService.addCondition(currentCondition);
  }

  public onAiButtonClick(): void {
    this.askAi();
  }

    public synthesizeWithAi(): void {
        this.synthesizeRequested.emit();
    }

    public get aiButtonClass(): string {
        return 'cursor-pointer pi pi-sparkles';
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
    this.textChanged.emit();
  }

  protected readonly $dt = $dt;
  protected isDialogVisible: boolean = false;

  protected onEditConditionClick() {
    this.dialogConditionText = this.condition.getValue().condition;
    this.dialogSyntaxCheck.checkNow(this.dialogConditionText);
    this.isDialogVisible = true;
  }

  protected onDialogConditionChange(text: string) {
    this.dialogConditionText = text;
    this.dialogSyntaxCheck.checkDelayed(text);
  }

  protected onDialogDiscardClick() {
    this.isDialogVisible = false;
  }

  protected onDialogSaveClick() {
    this.onConditionChange(this.dialogConditionText);
    ConditionEditorComponent.checkNowRequests.next(this.condition.getValue());
    this.dialogSyntaxCheck.cancel();
    this.isDialogVisible = false;
  }
}
