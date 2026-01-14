import { HttpErrorResponse } from "@angular/common/http";

export type LogType = "ERROR" | "INFO" | "DEBUG" | "WARN";

export abstract class ConsoleLogLine {
  public abstract readonly type: LogType;
}

export class ConsoleErrorLine extends ConsoleLogLine {
  override type: LogType = "ERROR";
  public action: string;
  public error: HttpErrorResponse | string;

  constructor(action: string, error: HttpErrorResponse | string) {
    super();
    this.action = "Error: " + action;
    this.error = error;
  }
}

export class ConsoleInfoLine extends ConsoleLogLine {
  override type: LogType = "INFO";
  public message: string;
  public icon?: string;

  constructor(message: string, icon?: string) {
    super();
    this.message = message;
    this.icon = icon;
  }
}

export function isError(line: ConsoleLogLine): line is ConsoleErrorLine {
  return line.type === "ERROR";
}

export function isInfo(line: ConsoleLogLine): line is ConsoleInfoLine {
  return line.type === "INFO";
}
