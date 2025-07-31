import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConsoleService } from '../../services/console/console.service';
import { MatListModule } from '@angular/material/list';
import { ConsoleLogLine } from '../../services/console/log';
import { HttpErrorResponse } from '@angular/common/http';


/**
 * Visual representation of the errors in the application
 * This component is placed in a sidebar under the root app component.
 */
@Component({
    selector: 'app-console',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatListModule],
    templateUrl: './console.component.html',
    standalone: true,
    styleUrl: './console.component.scss'
})
export class ConsoleComponent {

  public constructor(private service: ConsoleService) {}

  /**
   * Remove the errors from the console
   */
  public clear() {
    this.service.clear()
  }

  /**
   * Format the error as a string in case of HTTP errors
   * @param line The line to represent as string
   * @returns The formated string of HTTP errors to passing through the string in the error
   */
  public deconstructLogError(line : ConsoleLogLine) : string {
    if (line.error instanceof HttpErrorResponse) {
      return "(" + line.error.status + ") " + line.error.statusText  
    }

    return line.error as string
  }

  public get loglines() {
    return this.service.logs
  }
}
