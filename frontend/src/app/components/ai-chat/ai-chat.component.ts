import {AfterViewChecked, Component, ElementRef, ViewChild} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatChipsModule} from '@angular/material/chips';
import {MatListModule} from '@angular/material/list';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {AiMessage} from '../../services/ai-chat/ai-message';
import {AiChatService, LLM_PROVIDERS, LLMProviderOption} from '../../services/ai-chat/ai-chat.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Message} from "primeng/message";
import {Toolbar} from "primeng/toolbar";
import {Button} from "primeng/button";
import {Textarea} from "primeng/textarea";
import {Menu} from "primeng/menu";
import {MenuItem} from "primeng/api";


/**
 * Component for showing a dialog between user and the llm chat defined in the backend.
 */
@Component({
    selector: 'app-ai-chat',
    imports: [MatChipsModule, MatInputModule, MatFormFieldModule, MatListModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule, FormsModule, ReactiveFormsModule, MatTooltipModule, Message, Toolbar, Button, Textarea, Menu],
    templateUrl: './ai-chat.component.html',
    standalone: true,
    styleUrl: './ai-chat.component.css'
})
export class AiChatComponent implements AfterViewChecked {

    @ViewChild('messageContainer') private messageContainer!: ElementRef<HTMLDivElement>;

    private _chatservice: AiChatService
    private _questionGroup: FormGroup = this.fb.group({
        question: ""
    })
    private _lastMessageCount = 0;

    modelMenuItems: MenuItem[] = LLM_PROVIDERS.map(p => ({
        label: p.label,
        command: () => this.selectProvider(p)
    }));

    constructor(aichatservice: AiChatService, private fb: FormBuilder) {
        this._chatservice = aichatservice
    }

    ngAfterViewChecked(): void {
        if (this.messages.length !== this._lastMessageCount) {
            this._lastMessageCount = this.messages.length;
            this.scrollToBottom();
        }
    }

    private scrollToBottom(): void {
        const el = this.messageContainer?.nativeElement;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }

    public onEnter(event: Event) {
        event.preventDefault()
        this.addMessage()
    }

    public addMessage(): void {
        if (!(this._questionGroup.get("question")!.value.trim())) return;
        if (this._chatservice.addMessage(this._questionGroup.get("question")!.value)) {
            this._questionGroup.get("question")!.setValue("")
        }
    }

    public deleteHistory(): void {
        this._chatservice.deleteHistory()
    }

    public getResponseType(message: AiMessage): 'info' | 'secondary' {
        return message.isResponse ? "secondary" : "info"
    }

    public getChatRole(message: AiMessage): string {
        return message.isResponse ? "message-response" : "message-question"
    }

    public get messages(): AiMessage[] {
        return this._chatservice.messages
    }

    public get questionGroup(): FormGroup {
        return this._questionGroup
    }

    public get selectedProviderLabel(): string {
        return this._chatservice.selectedProvider.label
    }

    private selectProvider(provider: LLMProviderOption): void {
        this._chatservice.selectedProvider = provider
    }
}
