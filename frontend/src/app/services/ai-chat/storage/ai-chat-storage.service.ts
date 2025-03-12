import { Injectable } from '@angular/core';
import { AiMessage, OpenAiMessage, OpenAiRequest } from '../ai-message';

@Injectable({
  providedIn: 'root'
})
export class AiChatStorageService {

  private static readonly historyKey = "aiChatHistory"

  constructor() { }

  public persistHistory(messages : AiMessage[]) {
    const history : OpenAiMessage[] = []

    for (const message of messages) {
      history.push(message.export())
    }

    sessionStorage.setItem(AiChatStorageService.historyKey, JSON.stringify(history))
  }

  public readHistory() : AiMessage[] {
    let history : AiMessage[] = []
    let freeId : number = 0

    let storageContent : string | null = sessionStorage.getItem(AiChatStorageService.historyKey)
    if (!storageContent) return history

    let storageHistory : OpenAiMessage[] = JSON.parse(storageContent)

    for (const message of storageHistory) {
      history.push(new AiMessage(freeId, message.content, message.role === "assistant"))
      freeId += 1
    }

    return history
  }
}
