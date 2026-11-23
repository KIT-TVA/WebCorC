import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import {
  ConsoleErrorLine,
  ConsoleInfoLine,
  ConsoleLogGroup,
  ConsoleLogLine,
  LogStatus,
} from "./log";

/**
 * Service to allow interaction with the console
 * Caution: Not fully implemented
 */
@Injectable({
  providedIn: "root",
})
export class ConsoleService {
  /**
   * Signal so the console re-renders under zoneless change detection.
   * Changes to group lines/status must go through addLineToGroup/setGroupStatus, which replace the array to notify.
   */
  private readonly _logs = signal<(ConsoleLogLine | ConsoleLogGroup)[]>([]);
  public loading = signal(false);
  public loadingMessage = signal("");

  constructor() {}

  public get logs() {
    return this._logs();
  }

  public get numberOfLogs() {
    return this._logs().length;
  }

  public addErrorResponse(error: HttpErrorResponse, action: string = "") {
    this.append(new ConsoleErrorLine(action, error));
  }

  public addStringError(error: string, action: string = "") {
    this.append(new ConsoleErrorLine(action, error));
  }

  public addStringInfo(info: string, icon?: string) {
    this.append(new ConsoleInfoLine(info, icon));
  }

  public addGroup() {
    const group = new ConsoleLogGroup();
    this.append(group);
    return group;
  }

  public addLineToGroup(group: ConsoleLogGroup, line: ConsoleLogLine) {
    group.lines.push(line);
    this.notifyChange();
  }

  public setGroupStatus(group: ConsoleLogGroup, status: LogStatus) {
    group.status = status;
    this.notifyChange();
  }

  public clear() {
    this._logs.set([]);
  }

  public beginLoading(action: string) {
    this.loading.set(true);
    this.loadingMessage.set(action);
  }

  public finishLoading() {
    this.loading.set(false);
    this.loadingMessage.set("");
  }

  private append(line: ConsoleLogLine | ConsoleLogGroup) {
    this._logs.update((logs) => [...logs, line]);
  }

  private notifyChange() {
    this._logs.update((logs) => [...logs]);
  }
}
