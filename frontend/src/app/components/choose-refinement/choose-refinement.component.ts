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
import { SimpleStatementComponent } from '../editor/refinements/simple-statement/simple-statement.component';
import { SelectionStatementComponent } from '../editor/refinements/selection-statement/selection-statement.component';
import { CompositionStatementComponent } from '../editor/refinements/composition-statement/composition-statement.component';
import { RepetitionStatementComponent } from '../editor/refinements/repetition-statement/repetition-statement.component';
import { StrongWeakStatementComponent } from '../editor/refinements/strong-weak-statement/strong-weak-statement.component';

@Component({
  selector: 'app-choose-refinement',
  standalone: true,
  imports: [CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, RefinementWidgetComponent, MatDialogClose],
  templateUrl: './choose-refinement.component.html',
  styleUrl: './choose-refinement.component.scss'
})
export class ChooseRefinementComponent {
  readonly REFINEMENT_WIDGETS: {name: string, icon: string, component: Type<Refinement>}[] = [
    {name: "Statement", icon: "trending_flat", component: SimpleStatementComponent},
    {name: "Selection", icon: "vertical_split", component: SelectionStatementComponent},
    {name: "Composition", icon: "account_tree", component: CompositionStatementComponent},
    {name: "Repetition", icon: "autorenew", component: RepetitionStatementComponent},
    {name: "Strong-Weak", icon: "priority_high", component: StrongWeakStatementComponent}
  ];

  constructor(public dialogRef: MatDialogRef<ChooseRefinementComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
