import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import {
  ConsoleErrorLine,
  ConsoleInfoLine,
  ConsoleLogGroup,
  ConsoleLogLine,
} from "./log";

/**
 * Service to allow interaction with the console
 * Caution: Not fully implemented
 */
@Injectable({
  providedIn: "root",
})
export class ConsoleService {
  private _logs: (ConsoleLogLine | ConsoleLogGroup)[] = [];
  public loading = signal(false);
  public loadingMessage = signal("");

  constructor() {}

  public get logs() {
    return this._logs;
  }

  public get numberOfLogs() {
    return this._logs.length;
  }

  public addErrorResponse(error: HttpErrorResponse, action: string = "") {
    this._logs.push(new ConsoleErrorLine(action, error));
  }

  public addStringError(error: string, action: string = "") {
    this._logs.push(new ConsoleErrorLine(action, error));
  }

  public addStringInfo(info: string, icon?: string) {
    this._logs.push(new ConsoleInfoLine(info, icon));
  }

  public addGroup() {
    const group = new ConsoleLogGroup();
    this._logs.push(group);
    return group;
  }

  public clear() {
    this._logs = [];
  }

  public beginLoading(action: string) {
    this.loading.set(true);
    this.loadingMessage.set(action);
  }

  public finishLoading() {
    this.loading.set(false);
    this.loadingMessage.set("");
  }
}
