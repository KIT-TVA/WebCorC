import { HttpErrorResponse } from "@angular/common/http";

export class ConsoleLogLine {

    public action : string
    public error : HttpErrorResponse | string

    constructor(
        action : string,
        error : HttpErrorResponse | string 
    ) {
        this.action = "Error: " + action
        this.error = error
    }
}