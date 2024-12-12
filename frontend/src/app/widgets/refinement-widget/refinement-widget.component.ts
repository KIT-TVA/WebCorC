import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatIconModule} from "@angular/material/icon";

/**
 * Button in the add refinement widget
 */
@Component({
    selector: 'app-refinement-widget',
    imports: [CommonModule, MatIconModule],
    template: `
    <div id="background">
      <mat-icon>{{icon}}</mat-icon><br>
      <span>{{text}}</span>
    </div>
  `,
    styles: `
    #background {
      width: fit-content;
      padding: 10px;
      text-align: center;
      border-radius: 5px;
      color: gray;
      margin: auto;
      width: 100px;
      margin-top: 20px;
      cursor: pointer;
    }
  `
})
export class RefinementWidgetComponent {
  @Input() icon: string = "";
  @Input() text: string = "";
}
