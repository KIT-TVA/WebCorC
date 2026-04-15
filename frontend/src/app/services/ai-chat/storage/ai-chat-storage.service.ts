import { Injectable } from '@angular/core';
import { AiMessage, OpenAiMessage } from '../ai-message';

/**
 * Service to persist the current message history of the ai-chat service in the session Storage
 */
@Injectable({
  providedIn: 'root'
})
export class AiChatStorageService {

  private static readonly historyKey = "aiChatHistory"

  constructor() { }

  /**
   * Save the messages to session storage.
   * @param messages The messages to save to session storage.
   */
  public persistHistory(messages : AiMessage[]) {
    const history : OpenAiMessage[] = []

    for (const message of messages) {
      history.push(message.export())
    }

    sessionStorage.setItem(AiChatStorageService.historyKey, JSON.stringify(history))
  }

  /**
   * Read the history from session storage.
   * @returns The history in the session storage.
   */
  public readHistory() : AiMessage[] {
    const history : AiMessage[] = []
    let freeId : number = 0

    const storageContent : string | null = sessionStorage.getItem(AiChatStorageService.historyKey)
    if (!storageContent) return history

    const storageHistory : OpenAiMessage[] = JSON.parse(storageContent)

    for (const message of storageHistory) {
      history.push(new AiMessage(freeId, message.content, message.role === "assistant"))
      freeId += 1
    }

    return history
  }
}
