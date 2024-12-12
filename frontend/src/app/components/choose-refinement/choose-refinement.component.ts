import {Component, Type} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {RefinementWidgetComponent} from "../../widgets/refinement-widget/refinement-widget.component";
import {Refinement} from "../../types/refinement";
import { SimpleStatementComponent } from '../editor/statements/simple-statement/simple-statement.component';
import { SelectionStatementComponent } from '../editor/statements/selection-statement/selection-statement.component';
import { CompositionStatementComponent } from '../editor/statements/composition-statement/composition-statement.component';
import { RepetitionStatementComponent } from '../editor/statements/repetition-statement/repetition-statement.component';
import { StrongWeakStatementComponent } from '../editor/statements/strong-weak-statement/strong-weak-statement.component';


/**
 * Dialog for adding the refinements as a child of the element which opened this Dialog
 * @link https://material.angular.io/components/dialog/overview
 */
@Component({
  selector: 'app-choose-refinement',
  standalone: true,
  imports: [CommonModule, MatDialogTitle, MatDialogContent,
            MatDialogActions, MatButtonModule, RefinementWidgetComponent,
            MatDialogClose],
  templateUrl: './choose-refinement.component.html',
  styleUrl: './choose-refinement.component.scss'
})
export class ChooseRefinementComponent {
  /**
   * Constant for the displayed buttons, their icons and the spawned component
   */
  public readonly REFINEMENT_WIDGETS: {name: string, icon: string, component: Type<Refinement>}[] = [
    {name: "Statement", icon: "trending_flat", component: SimpleStatementComponent},
    {name: "Selection", icon: "vertical_split", component: SelectionStatementComponent},
    {name: "Composition", icon: "account_tree", component: CompositionStatementComponent},
    {name: "Repetition", icon: "autorenew", component: RepetitionStatementComponent},
    {name: "Strong-Weak", icon: "priority_high", component: StrongWeakStatementComponent}
  ];

  /**
   * Constructor for dependency injection of the dialog ref of this component
   * @param dialogRef The MatDialogRef of this component, used to interact with the dialog form the inside of this component
   */
  public constructor(public dialogRef: MatDialogRef<ChooseRefinementComponent>) {}

  /**
   * Close the Dialog when clicking outside the dialog content
   */
  public onNoClick(): void {
    this.dialogRef.close();
  }
}
