import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConsoleLogLine } from './log';

/**
 * Service to allow interaction with the console
 * Caution: Not fully implemented
 */
@Injectable({
  providedIn: 'root'
})
export class ConsoleService {
  private _logs : ConsoleLogLine[] = []

  constructor() {}

  public get logs() {
    return this._logs
  }

  public get numberOfLogs () {
    return this._logs.length
  }

  public addErrorResponse(error : HttpErrorResponse, action : string = "") {
    this._logs.push(new ConsoleLogLine(action, error))
  }

  public addStringError(error : string, action : string = "") {
    this._logs.push(new ConsoleLogLine(action, error))
  }

  public clear() {
    this._logs = []
  }
}
