import {Component, EventEmitter, Input, model, ModelSignal, OnInit, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInput, MatInputModule} from "@angular/material/input";
import {ICondition} from "../../../../types/condition/condition";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatMenuModule} from "@angular/material/menu";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from '@angular/material/icon';
import {AiChatService} from '../../../../services/ai-chat/ai-chat.service';

/**
 * Editor in the statements for the {@link Condition}
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
    selector: 'app-condition-editor',
    imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatGridListModule,
        ReactiveFormsModule, MatAutocompleteModule, MatMenuModule, MatButtonModule, MatIconModule],
    templateUrl: './condition-editor.component.html',
    standalone: true,
    styleUrl: './condition-editor.component.scss'
})
export class ConditionEditorComponent implements OnInit {

    /**
     * Condition to edit
     */
    public condition: ModelSignal<ICondition> = model.required<ICondition>();

    /**
     * Flag to allow editing the condition content
     */
    @Input() public editable = true;

    /**
     * Emitter to emit the the condition
     */
    @Output() public conditionEditingFinished: EventEmitter<void> = new EventEmitter<void>();

    /**
     * The input to edit the condition content
     */
    @ViewChild("input", {read: MatInput}) public input!: MatInput;

    private _conditionGroup: FormGroup | undefined;

    public constructor(private fb: FormBuilder, private _aiChatService: AiChatService) {
    }

    /**
     * Initialize the input on angular initalization
     */
    public ngOnInit() {
        // Set up form group on init, since here the @Inputs available
        this._conditionGroup = this.fb.group({
            condition: ""
        });
        this._conditionGroup.get("condition")!.setValue(this.condition()?.programStatement);
        if (!this.editable) {
            this._conditionGroup.get("condition")!.disable();
        }
    }

    /**
     * Function for sending the condition content to the ai chat
     * @see AiChatService
     */
    public askAi(): void {
        if (!this.condition()?.programStatement) return
        this._aiChatService.addCondition(this.condition()!)
    }

    /**
     * Getter for the FormGroup for management of the
     */
    public get conditionGroup(): FormGroup | undefined {
        return this._conditionGroup
    }


}
