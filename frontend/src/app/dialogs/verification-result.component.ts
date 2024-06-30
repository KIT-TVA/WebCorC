import {Component, Inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {RequestError, VerificationResult} from "../types/net/verification-net-types";
import {MatButtonModule} from "@angular/material/button";
import {VerificationErrorListComponent} from "../components/verification-error-list.component";

@Component({
  selector: 'app-verification-result',
  standalone: true,
  imports: [CommonModule, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogTitle, VerificationErrorListComponent],
  template: `
      <h2 mat-dialog-title>Verification Result</h2>
      <mat-dialog-content>
          @if (requestError) {
              <p>A request error occurred: {{ requestError.title }}</p>
          } @else if (verificationResult) {
              <app-verification-error-list [result]="verificationResult" [refinementId]="data.refinementId">
              </app-verification-error-list>
          }
      </mat-dialog-content>
      <mat-dialog-actions>
          <button mat-button (click)="dialogRef.close()">Close</button>
      </mat-dialog-actions>
  `,
  styles: ``
})
export class VerificationResultComponent {
  verificationResult: VerificationResult | undefined;
  requestError: RequestError | undefined;

  constructor(public dialogRef: MatDialogRef<VerificationResultComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {result: VerificationResult | RequestError, refinementId?: number}) {
    if ("title" in data.result) {
      this.requestError = data.result as RequestError;
    } else {
      this.verificationResult = data.result as VerificationResult;
    }
  }
}
