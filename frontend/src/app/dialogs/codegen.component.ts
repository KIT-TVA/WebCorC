import {Component, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {TreeService} from "../services/tree/tree.service";
import {MatTabGroup, MatTabsModule} from "@angular/material/tabs";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

/**
 * Todo: Rewrite for new Backend
 */
@Component({
    selector: 'app-codegen',
    imports: [CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatTabsModule, MatCheckboxModule, ReactiveFormsModule],
    template: `
    <h2 mat-dialog-title>Code Generation</h2>
    <mat-dialog-content>
        <mat-tab-group #tabGroup>
            <mat-tab label="Qiskit">
                Generate Qiskit code in Python.
                <form [formGroup]="qiskitOptionsFormGroup">
                    <mat-checkbox formControlName="includeConditions">Include conditions</mat-checkbox>
                </form>
                <br><br>
            </mat-tab>
        </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions>
        <button mat-raised-button color="primary" (click)="generateCode()">Generate</button>
        <button mat-button (click)="dialogRef.close()">Close</button>
    </mat-dialog-actions>
  `,
    styles: ``
})
export class CodegenComponent {
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;

  qiskitOptionsFormGroup = this.fb.group({
    includeConditions: false
  });

  constructor(public dialogRef: MatDialogRef<CodegenComponent>,
              private fb: FormBuilder, private treeService: TreeService, ) {
  }

  generateCode(): void {
    const options = {
      includeConditions: this.qiskitOptionsFormGroup.get("includeConditions")!.value
    }
    let language = "";
    switch (this.tabGroup.selectedIndex) {
      case 0: language = "qiskit"; break;
    }

    this.treeService.generateCode(language, options);
    this.dialogRef.close();
  }
}
