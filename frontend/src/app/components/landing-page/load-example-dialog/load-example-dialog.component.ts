import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from '@angular/material/button';
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';

@Component({
  selector: 'app-load-example-dialog',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  templateUrl: './load-example-dialog.component.html',
  styleUrl: './load-example-dialog.component.scss'
})
export class LoadExampleDialogComponent {
  public readonly EXAMPLE_PROGRAMS: {name: string, icon: string}[] = [
    {name: "LinearSearch", icon: "manage_search"},
    {name: "DutchFlag", icon: "flag"},
    {name: "MaxElement", icon: "trending_up"},
  ];
}
