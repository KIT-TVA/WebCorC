import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {VerificationResult} from "../types/net/verification-net-types";
import {MatListModule} from "@angular/material/list";
import {MatIconModule} from "@angular/material/icon";

@Component({
  selector: 'app-verification-error-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule],
  template: `
      <mat-list>
          @if (!refinementId) {
              <div matSubheader>The verification process provides the following result:</div>
          }

          @if (refinementId && result.prover[refinementId]) {
              @if (result.prover[refinementId] === 'No suitable prover found') {
                  <mat-list-item>
                      <mat-icon matListItemIcon>info</mat-icon>
                      <div matListItemTitle>Used prover: {{result.prover[refinementId]}}</div>
                  </mat-list-item>
              } @else {
                  <mat-list-item>
                      <mat-icon matListItemIcon>verified_user</mat-icon>
                      <div matListItemTitle>Used prover: {{result.prover[refinementId]}}</div>
                  </mat-list-item>
              }
          }
          @if (result.correctnessCondition && result.correctnessCondition !== 'true') {
              <mat-list-item>
                  <mat-icon matListItemIcon style="color: rgba(255,184,23,0.97)">warning</mat-icon>
                  <div>Correct when: {{result.correctnessCondition}}</div>
              </mat-list-item>
          }
          @if (result.errors.length === 0) {
              <mat-list-item>
                  <mat-icon matListItemIcon style="color: rgb(46,171,63)">check</mat-icon>
                  <div matListItemTitle>No errors occurred</div>
              </mat-list-item>
          } @else {
              @for (error of result.errors; track error) {
                  <mat-list-item>
                      <mat-icon matListItemIcon style="color: rgb(201,73,73)">error</mat-icon>
                      <p>
                          {{error.type}}{{refinementId ? "" : " (refinement #" + error.refinementID + ")"}}: {{error.message}}
                      </p>
                  </mat-list-item>
              }
          }
      </mat-list>
  `,
  styles: ``
})
export class VerificationErrorListComponent {
  @Input() result!: VerificationResult;
  @Input() refinementId: number | undefined;
}
