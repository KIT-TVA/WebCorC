import { Injectable } from "@angular/core";
import { AiMessage } from "./ai-message";
import { Condition, ICondition } from "../../types/condition/condition";
import { AiChatStorageService } from "./storage/ai-chat-storage.service";
import { AiChatNetworkService } from "./network/ai-chat-network.service";

/**
 * Service for managing the chat history and getting an answer.
 */
@Injectable({
  providedIn: "root",
})
export class AiChatService {
  private static readonly APPROX_MAX_TOKENS: number = 3800;
  private static readonly EXPLAIN_CONDITION_CONTENT_PROMPT =
    "In one sentence explain the following formal specification: ";

  private _messages: AiMessage[] = [];
  private _freeId: number = 0;

  constructor(
    private storage: AiChatStorageService,
    private network: AiChatNetworkService,
  ) {
    this._messages = this.storage.readHistory();
    // on answer add the maass
    this.network.answer.subscribe((answer) => {
      this.addMessage(answer, false);
    });
  }

  /**
   * Add Message to the history if the sum of the approxmiate tokens is smaller than 3800.
   * @param content the message content
   * @param getAnswer if true send history to backend.
   * @returns success
   */
  public addMessage(content: string, getAnswer: boolean = true): boolean {
    const message = new AiMessage(this._freeId, content, !getAnswer);
    this._freeId += 1;

    let sumOfTokens = 0;
    for (const _message of this._messages) {
      sumOfTokens += this.approximateTokens(_message);
    }

    if (sumOfTokens > AiChatService.APPROX_MAX_TOKENS) {
      return false;
    }

    this._messages.push(message);
    this.storage.persistHistory(this._messages);
    if (getAnswer) {
      this.network.sendHistory(this._messages);
    }
    return true;
  }

  /**
   * Clear history
   */
  public deleteHistory(): void {
    this._messages = [];
    this.storage.persistHistory([]);
    this._freeId = 0;
  }

  /**
   * Add condition content to the chat content
   * @param condition The condition to ask about
   */
  public addCondition(condition: ICondition) {
    this.addMessage(
      AiChatService.EXPLAIN_CONDITION_CONTENT_PROMPT + condition.condition,
    );
  }

  private approximateTokens(message: AiMessage) {
    return message.content.length / 4;
  }

  public get newMessages(): boolean {
    return this._messages.length > 0;
  }

  public get messages() {
    return this._messages;
  }
}
