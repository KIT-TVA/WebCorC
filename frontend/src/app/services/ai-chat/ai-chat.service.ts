import { Injectable } from "@angular/core";
import { AiMessage, LLMProviderType } from "./ai-message";
import { ICondition } from "../../types/condition/condition";
import { AiChatStorageService } from "./storage/ai-chat-storage.service";
import { AiChatNetworkService } from "./network/ai-chat-network.service";
import { IJavaVariable } from "../../types/JavaVariable";
import { BehaviorSubject } from "rxjs";

export interface LLMProviderOption {
  label: string;
  provider: LLMProviderType;
  model: string;
}

export const LLM_PROVIDERS: LLMProviderOption[] = [
  { label: "GPT",    provider: "OPENAI",    model: "gpt-5.5" },
  { label: "Claude",   provider: "ANTHROPIC",  model: "claude-opus-4-7" },
  { label: "Grok",     provider: "XAI",        model: "grok-4.3" },
  { label: "Gemini",   provider: "GOOGLE",     model: "gemini-3.1-pro-preview" },
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
  private _selectedProvider: LLMProviderOption = LLM_PROVIDERS[1];
  private _awaitingSynthesisResponse = false;
  private _synthesisInProgress = false;
  private _synthesisTarget?: BehaviorSubject<ICondition>;
  private _synthesisResponseIds = new Set<number>();
  private _synthesisRawByMessageId = new Map<number, string>();
  private _synthesisStatementName?: string;
  private _synthesisProviderByMessageId = new Map<number, string>();
  private _synthesisStatementByMessageId = new Map<number, string>();

  constructor(
    private storage: AiChatStorageService,
    private network: AiChatNetworkService,
  ) {
    this._messages = this.storage.readHistory();
    this._freeId = this._messages.length;
    this.network.answer.subscribe((answer) => {
      if (this._awaitingSynthesisResponse) {
        this._awaitingSynthesisResponse = false;
        this._synthesisInProgress = false;
        const javaOnly = this.ensureTrailingSemicolon(this.extractJavaOnly(answer));
        if (javaOnly && javaOnly.trim()) {
          const message = this.pushMessage(javaOnly, false);
          if (message) {
            this._synthesisResponseIds.add(message.id);
            this._synthesisRawByMessageId.set(message.id, javaOnly);
            this._synthesisProviderByMessageId.set(
              message.id,
              this._selectedProvider.label,
            );
            if (this._synthesisStatementName) {
              this._synthesisStatementByMessageId.set(
                message.id,
                this._synthesisStatementName,
              );
            }
          }
        }
        return;
      }
      const message = this.pushMessage(answer, false);
      if (message) {
        this._synthesisProviderByMessageId.set(message.id, this._selectedProvider.label);
      }
    });
    this.network.error.subscribe((errorText) => {
      if (this._awaitingSynthesisResponse) {
        this._awaitingSynthesisResponse = false;
        this._synthesisInProgress = false;
      }
      const message = this.pushMessage(`Model error: ${errorText}`, false);
      if (message) {
        this._synthesisProviderByMessageId.set(message.id, this._selectedProvider.label);
      }
    });
  }

  /**
   * Add Message to the history if the sum of the approximate tokens is smaller than 3800.
   * @param content the message content
   * @param getAnswer if true send history to backend.
   * @param label optional label for the message (e.g., "User", "System").
   * @returns success
   */
 public addMessage(content: string, getAnswer: boolean = true, label?: string): boolean {
    const message = this.pushMessage(content, getAnswer);
    if (message && getAnswer) {
      // Mark messages with provided label or default to "User"
      this._synthesisProviderByMessageId.set(message.id, label || "User");
    }
    return message !== undefined;
  }

  private pushMessage(
    content: string,
    getAnswer: boolean = true,
  ): AiMessage | undefined {
    if (!content || !content.trim()) {
      return undefined;
    }

    const message = new AiMessage(this._freeId, content, !getAnswer);
    this._freeId += 1;

    let sumOfTokens = 0;
    for (const _message of this._messages) {
      sumOfTokens += this.approximateTokens(_message);
    }

    if (sumOfTokens > AiChatService.APPROX_MAX_TOKENS) {
      return undefined;
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
    return message;
  }

  public deleteHistory(): void {
    this._messages = [];
    this.storage.persistHistory([]);
    this._freeId = 0;
    this._synthesisResponseIds.clear();
    this._synthesisRawByMessageId.clear();
    this._synthesisProviderByMessageId.clear();
    this._synthesisStatementByMessageId.clear();
  }

  public addCondition(condition: ICondition) {
    this.addMessage(
      AiChatService.EXPLAIN_CONDITION_CONTENT_PROMPT + condition.condition,
      true,
      "System"
    );
  }

  public addSynthesisPrompt(
    variables: IJavaVariable[],
    preText: string,
    postText: string,
    isLoopUpdate: boolean,
  ): boolean {
    const promptHeader = `You are a small-step synthesis assistant for Java updates in CbC/KeY workflows.
Your task is to generate the minimal but logically sufficient Java statement block
that transforms any state satisfying the PRE-condition into one satisfying the POST-condition.

Input format (JSON): { "variables": [{"name": str, "modifiable": bool, "type": str}, ...], "pre_text": str, "post_text": str, "is_loop_update": bool }

Rules:
- Modify only variables flagged "modifiable".
- Never modify or write to non-modifiable variables.
- Accessing members of the current object syntactically correctly.
- Prefer straight-line (loop-free) code unless "is_loop_update" is true.
- Only emit assignment statements and method-call statements on declared variables.
- Do not emit return statements. If available, use variable 'ret' for assigning return values.
- Do not emit control flow or branching constructs (if, else, switch, for, while, do, try, ternary ?:, or extra block braces).
- Use only declared variables and their types. No new variables.
- You may read from non-modifiable arrays or objects to use their values in assignments.
- Ensure array accesses remain within bounds implied by PRE.
- Always ensure that the variant variable strictly decreases when present.
- Produce all statements necessary to make POST true.
- Use Java boolean literals true and false (lowercase), never TRUE/FALSE.
- Always output EXACTLY this JSON format: {"java": "<Java statements separated by semicolons>"}.

Now solve this synthesis task JSON:`;

    const payload = {
      variables: variables.map((v) => {
        const declaration = (v.name || "").trim();
        const parts = declaration.split(/\s+/);
        const parsedName =
          parts.length > 1 ? parts[parts.length - 1] : declaration;
        const parsedType =
          parts.length > 1 ? parts.slice(0, -1).join(" ") : "unknown";
        return {
          name: parsedName,
          modifiable: v.kind !== "GLOBAL",
          type: parsedType,
        };
      }),
      pre_text: preText,
      post_text: postText,
      is_loop_update: isLoopUpdate,
    };

    const synthesisMessage = new AiMessage(
      -1,
      `${promptHeader}\n${JSON.stringify(payload)}`,
      false,
    );

    if (this.approximateTokens(synthesisMessage) > AiChatService.APPROX_MAX_TOKENS) {
      return false;
    }

    this._awaitingSynthesisResponse = true;
    this._synthesisInProgress = true;

    // Add system message for synthesis task
    const systemMessage = this.pushMessage(
      `Synthesis for statement ${this._synthesisStatementName || "unknown"}`,
      false
    );
    if (systemMessage) {
      this._synthesisProviderByMessageId.set(systemMessage.id, "System");
    }

    this.network.sendHistory(
      [synthesisMessage],
      this._selectedProvider.provider,
      this._selectedProvider.model,
    );
    return true;
  }

  private approximateTokens(message: AiMessage) {
    return message.content.length / 4;
  }

  private extractJavaOnly(content: string): string {
    const trimmed = (content || "").trim();

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.java === "string") {
        return parsed.java.trim();
      }
    } catch (_e) {}

    const jsonMatch = trimmed.match(/"java"\s*:\s*"((?:\\.|[^"\\])*)"/s);
    if (jsonMatch?.[1]) {
      try {
        return JSON.parse(`"${jsonMatch[1]}"`).trim();
      } catch (_e) {
        return jsonMatch[1].trim();
      }
    }

    const fenced = trimmed.match(/```(?:java|json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      const block = fenced[1].trim();
      try {
        const parsed = JSON.parse(block);
        if (parsed && typeof parsed.java === "string") {
          return parsed.java.trim();
        }
      } catch (_e) {}
      return block;
    }

    return trimmed;
  }

  private ensureTrailingSemicolon(code: string): string {
    const trimmed = (code || "").trim();
    if (!trimmed) {
      return trimmed;
    }
    return trimmed.endsWith(";") ? trimmed : `${trimmed};`;
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

  public get synthesisInProgress(): boolean {
    return this._synthesisInProgress;
  }

  public setSynthesisTarget(target?: BehaviorSubject<ICondition>): void {
    this._synthesisTarget = target;
  }

  public setSynthesisStatementName(statementName?: string): void {
    this._synthesisStatementName = statementName;
  }

  public isSynthesisResponse(message: AiMessage): boolean {
    return this._synthesisResponseIds.has(message.id);
  }

  public applySynthesisToTarget(message: AiMessage): boolean {
    if (!this._synthesisTarget || !this.isSynthesisResponse(message)) {
      return false;
    }
    const condition = this._synthesisTarget.getValue();
    const rawSynthesisCode =
      this._synthesisRawByMessageId.get(message.id) ?? message.content;
    condition.condition = rawSynthesisCode;
    this._synthesisTarget.next(condition);
    return true;
  }

  public getSynthesisProviderLabel(message: AiMessage): string {
    return this._synthesisProviderByMessageId.get(message.id) ?? "";
  }

  public getSynthesisStatementLabel(message: AiMessage): string {
    return this._synthesisStatementByMessageId.get(message.id) ?? "";
  }
}
