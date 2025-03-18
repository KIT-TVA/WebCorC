import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatChipsModule} from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import {MatCardModule} from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { AiMessage } from '../../services/ai-chat/ai-message';
import { AiChatService } from '../../services/ai-chat/ai-chat.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';






@Component({
  selector: 'app-ai-chat',
  imports: [MatChipsModule, MatInputModule, MatFormFieldModule, MatListModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule, FormsModule, ReactiveFormsModule, MatTooltipModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent {

  
  private _chatservice : AiChatService
 
  private _questionGroup : FormGroup = this.fb.group({
    question: ""
  })

  constructor(aichatservice : AiChatService, private fb : FormBuilder) {
    this._chatservice = aichatservice
  }

  public onEnter(event : Event) {
    event.preventDefault()
    this.addMessage()
  }

  public addMessage() : void {
    if (this._chatservice.addMessage(this._questionGroup.get("question")!.value)) {
      this._questionGroup.get("question")!.setValue("")
    }
    
  }

  public deleteHistory() : void {
    this._chatservice.deleteHistory()
  }

  public getClasses(message : AiMessage) : string {
    return message.isResponse ? "response" : "question"
  }

  public get messages() : AiMessage[] {
    return this._chatservice.messages
  }

  public get questionGroup() : FormGroup {
    return this._questionGroup
  }
  
}
