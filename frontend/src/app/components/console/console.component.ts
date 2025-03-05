import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConsoleService } from '../../services/console/console.service';
import { MatListModule } from '@angular/material/list';
import { ConsoleLogLine } from '../../services/console/log';
import { HttpErrorResponse } from '@angular/common/http';


/**
 * Visual representation of the errors in the application.
 * @link https://material.angular.io/components/form-field/overview
 * @link https://angular.dev/guide/forms/reactive-forms
 */
@Component({
    selector: 'app-console',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatListModule],
    templateUrl: './console.component.html',
    styleUrl: './console.component.scss'
})
export class ConsoleComponent {

  private _console: FormGroup = this._fb.group({
    content: new FormControl("", [])
  })

  private _logsControl = new FormControl()


  public constructor(private _fb: FormBuilder, private service: ConsoleService) {}

  /**
   * Clear the console
   */
  public clear() {
    this.service.clear()
  }


  public deconstructLogError(line : ConsoleLogLine) : string {
    if (line.error instanceof HttpErrorResponse) {
      return "(" + line.error.status + ") " + line.error.statusText  
    }

    return line.error as string
  }

  public get console() {
    return this._console
  }

  public get logsControl() {
    return this._logsControl
  }

  public get loglines() {
    return this.service.logs
  }
}
