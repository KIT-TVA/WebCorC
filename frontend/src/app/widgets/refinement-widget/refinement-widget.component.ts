import { Component, Input } from "@angular/core";

import { MatIconModule } from "@angular/material/icon";

/**
 * Button in the add refinement widget
 */
@Component({
  selector: "app-refinement-widget",
  imports: [MatIconModule],
  template: `
    <div id="background">
      <mat-icon>{{ icon }}</mat-icon>
      <br />
      <span>{{ text }}</span>
    </div>
  `,
  standalone: true,
  styles: `
    #background {
      padding: 10px;
      text-align: center;
      border-radius: 5px;
      color: #e0e0e0;
      margin: auto;
      width: 100px;
      margin-top: 20px;
      cursor: pointer;
    }
  `,
})
export class RefinementWidgetComponent {
  @Input() icon: string = "";
  @Input() text: string = "";
}
