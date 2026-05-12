import { Injectable } from "@angular/core";
import { AiMessage, LLMProviderType } from "./ai-message";
import { ICondition } from "../../types/condition/condition";
import { AiChatStorageService } from "./storage/ai-chat-storage.service";
import { AiChatNetworkService } from "./network/ai-chat-network.service";

export interface LLMProviderOption {
  label: string;
  provider: LLMProviderType;
  model: string;
}

export const LLM_PROVIDERS: LLMProviderOption[] = [
  { label: "GPT-4",  provider: "OPENAI",    model: "gpt-4-turbo" },
  { label: "Claude",   provider: "ANTHROPIC",  model: "claude-sonnet-4-20250514" },
  { label: "Grok",     provider: "XAI",        model: "grok-3" },
  { label: "Gemini",   provider: "GOOGLE",     model: "gemini-2.0-flash" },
];

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
  private _selectedProvider: LLMProviderOption = LLM_PROVIDERS[0];

  constructor(
    private storage: AiChatStorageService,
    private network: AiChatNetworkService,
  ) {
    this._messages = this.storage.readHistory();
    this.network.answer.subscribe((answer) => {
      this.addMessage(answer, false);
    });
  }

  /**
   * Add Message to the history if the sum of the approximate tokens is smaller than 3800.
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
      this.network.sendHistory(
        this._messages,
        this._selectedProvider.provider,
        this._selectedProvider.model,
      );
    }
    return true;
  }

  public deleteHistory(): void {
    this._messages = [];
    this.storage.persistHistory([]);
    this._freeId = 0;
  }

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

  public get selectedProvider(): LLMProviderOption {
    return this._selectedProvider;
  }

  public set selectedProvider(provider: LLMProviderOption) {
    this._selectedProvider = provider;
  }
}
