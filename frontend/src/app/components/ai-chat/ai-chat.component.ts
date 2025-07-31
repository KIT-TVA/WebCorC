import { Component } from '@angular/core';
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



/**
 * Component for showing a dialog between user and the llm chat defined in the backend.
 */
@Component({
    selector: 'app-ai-chat',
    imports: [MatChipsModule, MatInputModule, MatFormFieldModule, MatListModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule, FormsModule, ReactiveFormsModule, MatTooltipModule],
    templateUrl: './ai-chat.component.html',
    standalone: true,
    styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent {

  private _chatservice : AiChatService
  private _questionGroup : FormGroup = this.fb.group({
    question: ""
  })

  /**
   * Constructor for depdendency injection
   * @param aichatservice Service for holding and mangement of the messages 
   * @param fb Formbuilder for defining the question input
   */
  constructor(aichatservice : AiChatService, private fb : FormBuilder) {
    this._chatservice = aichatservice
  }

  /**
   * Triggered on pressing Enter in the formular for the question at the button of the component.
   * This function prevents the default behaviour of submitting the formular.
   * @param event The event which gets triggered on pressing enter in the formular
   */
  public onEnter(event : Event) {
    event.preventDefault()
    this.addMessage()
  }

  /**
   * Add a new Message with the content of the question input in the form.
   * Clears the content of the question input in the form, when the question gets added.
   */
  public addMessage() : void {
    if (this._chatservice.addMessage(this._questionGroup.get("question")!.value)) {
      this._questionGroup.get("question")!.setValue("")
    }
    
  }

  /**
   * Delete the current history
   */
  public deleteHistory() : void {
    this._chatservice.deleteHistory()
  }

  /**
   * Responds with the css classes to differentiate the responses and questions via css representation
   * @param message The message to classify as response or question
   * @returns Strings of the css classes response and question see .scss file of this component to see the applied style
   */
  public getClasses(message : AiMessage) : string {
    return message.isResponse ? "response" : "question"
  }

  /**
   * The messages listed in this component.
   */
  public get messages() : AiMessage[] {
    return this._chatservice.messages
  }

  /**
   * Form for the question input at the bottom of the component.
   */
  public get questionGroup() : FormGroup {
    return this._questionGroup
  }
  
}
