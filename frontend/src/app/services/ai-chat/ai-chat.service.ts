import { Injectable } from '@angular/core';
import { AiMessage } from './ai-message';
import { Condition } from '../../types/condition/condition';
import { AiChatStorageService } from './storage/ai-chat-storage.service';
import { AiChatNetworkService } from './network/ai-chat-network.service';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {

  private readonly APPROX_MAX_TOKENS : number = 3800

  private _messages : AiMessage[] = []
  private _freeId : number = 0

  constructor(private storage : AiChatStorageService, private network : AiChatNetworkService) {
    this._messages = this.storage.readHistory()

    this.network.answer.subscribe(answer => {
      this.addMessage(answer)
    })
  }

  public addMessage(content : string) : boolean  {
    const message = new AiMessage(this._freeId, content, false)
    this._freeId += 1 

    let sumOfTokens = 0
    for (const _message of this._messages) {
      sumOfTokens += this.approximateTokens(_message)
    }

    if (sumOfTokens > this.APPROX_MAX_TOKENS) {
      return false
    }

    this._messages.push(message)
    this.echo(content)
    this.storage.persistHistory(this._messages)
    return true
  }

  private echo(content : string) {
    const message = new AiMessage(this._freeId, content, true)
    this._freeId += 1

    this._messages.push(message)
  }

  public deleteHistory() : void {
    this._messages = []
    this.storage.persistHistory([])
    this._freeId = 0
  }

  public addCondition(condition : Condition) {
    this.addMessage("In one sentence explain the following formal specification: " + condition.content )
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
