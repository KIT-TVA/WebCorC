import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from '@angular/material/button';
import {MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';

@Component({
  selector: 'app-load-example-dialog',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions],
  templateUrl: './load-example-dialog.component.html',
  styleUrl: './load-example-dialog.component.scss'
})
export class LoadExampleDialogComponent {
  public readonly EXAMPLE_PROGRAMS: {name: string, icon: string}[] = [
    {name: "LinearSearch", icon: "manage_search"},
    {name: "DutchFlag", icon: "flag"},
    {name: "MaxElement", icon: "trending_up"},
  ];

  /**
   * Constructor for dependency injection of the dialog ref of this component
   * @param dialogRef The MatDialogRef of this component, used to interact with the dialog form the inside of this component
   */
  public constructor(public dialogRef: MatDialogRef<LoadExampleDialogComponent>) {}

  /**
   * Close the Dialog when clicking outside the dialog content
   */
  public onNoClick(): void {
    this.dialogRef.close();
  }
}
