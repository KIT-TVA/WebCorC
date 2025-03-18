import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConsoleService } from '../../console/console.service';
import { NetworkStatusService } from '../../networkStatus/network-status.service';
import { Observable, Subject, catchError, of } from 'rxjs';
import { AiMessage, OpenAiMessage, OpenAiRequest, OpenAiResponse } from '../ai-message';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiChatNetworkService {

  private static readonly path = "/editor/askquestion"
  private static readonly model = "gpt-4-turbo"

  private _answer = new Subject<string>

  constructor(private http : HttpClient,
    private consoleService : ConsoleService,
    private networkStatusService : NetworkStatusService,
  ) { }


  public sendContext(messages : AiMessage[]) : void {

    const context : OpenAiMessage[] = []

    for (const message of messages) {
      context.push(message.export())
    }

    const request : OpenAiRequest = { model: AiChatNetworkService.model, input : context}

    this.networkStatusService.startNetworkRequest()

    this.http
      .post<OpenAiResponse>(environment.apiUrl + AiChatNetworkService.path, request)
      .pipe(catchError((error : HttpErrorResponse) : Observable<OpenAiResponse> => {
        this.consoleService.addErrorResponse(error, "Asking LLM question")
        this.networkStatusService.stopNetworkRequest()
        return of()
      }))
      .subscribe(response => {
        this._answer.next(response.output[0].content[0].text)
      })

    
  }

  public get answer() : Subject<string> {
    return this._answer
  }
}
