import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RefinementWidgetComponent} from "../refinement-widget/refinement-widget.component";
import {ChooseRefinementComponent} from "../../components/choose-refinement/choose-refinement.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'add-refinement-widget',
  standalone: true,
  imports: [CommonModule, RefinementWidgetComponent],
  template: `
    <refinement-widget [text]="text"
                       icon="add"
                       (click)="addRefinement()">
    </refinement-widget>
  `,
  styles: ``
})
export class AddRefinementWidgetComponent {
  @Input() text: string = "Add Refinement"
  @Output() onRefinementSelected = new EventEmitter();

  constructor(private dialog: MatDialog) {
  }

  addRefinement(): void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onRefinementSelected.emit(result);
      }
    });
  }
}
