import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {RefinementWidgetComponent} from "../../widgets/refinement-widget/refinement-widget.component";
import {StatementType} from "../../types/statements/abstract-statement";


/**
 * Dialog for adding the refinements as a child of the element which opened this Dialog
 * @link https://material.angular.io/components/dialog/overview
 */
@Component({
    selector: 'app-choose-refinement',
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
  public readonly REFINEMENT_WIDGETS: {name: string, icon: string, component: StatementType}[] = [
    {name: "Statement", icon: "trending_flat", component: "STATEMENT"},
    {name: "Selection", icon: "vertical_split", component: "SELECTION"},
    {name: "Composition", icon: "account_tree", component: "COMPOSITION"},
    {name: "Repetition", icon: "autorenew", component: "REPETITION"},
    {name: "Strong-Weak", icon: "priority_high", component: "SKIP"}
  ];
}
