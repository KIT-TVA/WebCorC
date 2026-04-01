import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ConsoleService } from "../../console/console.service";
import { catchError, Observable, of, Subject } from "rxjs";
import {
  AiMessage,
  LLMMessage,
  LLMProviderType,
  LLMRequest,
  LLMResponse,
} from "../ai-message";
import { environment } from "../../../../environments/environment";

/**
 * Service for sending the message in the ai chat to the backend to get an answer from an LLM.
 * Supports multiple providers via the provider/model parameters.
 */
@Injectable({
  providedIn: "root",
})
export class AiChatNetworkService {
  private static readonly path = "/editor/askquestion";
  private _answer = new Subject<string>();

  public constructor(
    private http: HttpClient,
    private consoleService: ConsoleService,
  ) {}

  /**
   * Send the history to the backend to get a response from the selected LLM.
   * @param messages The messages to include in the context for the answer.
   * @param provider The LLM provider to use.
   * @param model The specific model name.
   */
  public sendHistory(messages: AiMessage[], provider: LLMProviderType, model: string): void {
    const context: LLMMessage[] = [];

    for (const message of messages) {
      context.push(message.export());
    }

    const request: LLMRequest = {
      model: model,
      provider: provider,
      input: context,
    };

    this.http
      .post<LLMResponse>(
        environment.apiUrl + AiChatNetworkService.path,
        request,
      )
      .pipe(
        catchError((error: HttpErrorResponse): Observable<LLMResponse> => {
          this.consoleService.addErrorResponse(error, "Asking LLM question");
          return of();
        }),
      )
      .subscribe((response) => {
        this._answer.next(response.text);
      });
  }

  public get answer(): Subject<string> {
    return this._answer;
  }
}
