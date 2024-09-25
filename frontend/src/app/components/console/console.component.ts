import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConsoleService } from '../../services/console/console.service';


/**
 * Currently very minimal textarea for showing the logs of the verification or generation services
 */
@Component({
  selector: 'app-console',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
  templateUrl: './console.component.html',
  styleUrl: './console.component.scss'
})
export class ConsoleComponent {

  console: FormGroup = this._fb.group({
    content: new FormControl("", [])
  })


  constructor(private _fb: FormBuilder, private service: ConsoleService) {
    service.ttyChange.subscribe(content => {
      this.console.get('content')!.setValue(content)
    })
  }

  public clear() {
    this.console.get('content')?.reset()
  }
}
