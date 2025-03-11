import { Injectable } from '@angular/core';
import { AiMessage } from './ai-message';
import { Condition } from '../../types/condition/condition';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {

  private readonly APPROX_MAX_TOKENS : number = 3800

  private _messages : AiMessage[] = []
  private _context : AiMessage[] = []

  public addMessage(content : string) : boolean  {
    const message = new AiMessage(content, false)

    let sumOfTokens = 0
    for (const _message of this._context) {
      sumOfTokens += this.approximateTokens(_message)
    }

    if (sumOfTokens > this.APPROX_MAX_TOKENS) {
      return false
    }

    this._messages.push(message)
    return true
  }

  public deleteMessage(message : AiMessage) : void {
    this._messages = this._messages.filter(_message => _message.content !== message.content)
    this.removeMessageFromContext(message)
  }

  public addCondition(condition : Condition) {
    this.addMessage("In one sentence explain the following formal specification: " + condition.content )
  }



  public addMessageToContext(message : AiMessage) {
    this._context.push(message)
  }

  public removeMessageFromContext(message : AiMessage) {
    this._context = this._context.filter(_message => _message.content !== message.content)
  }

  public isMessageinContext(message : AiMessage) {
    return this._context.includes(message)
  }

  private approximateTokens(message : AiMessage) {
    return message.content.length / 4
  }

  public get newMessages() : boolean {
    return this._messages.length > 0
  }

  public get messages() {
    return this._messages
  }
}
