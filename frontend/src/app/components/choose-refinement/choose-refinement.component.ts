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
import {InitRefinementComponent} from "../editor/refinements/init-refinement/init-refinement.component";
import {UnitRefinementComponent} from "../editor/refinements/unit-refinement/unit-refinement.component";
import {Refinement} from "../../types/refinement";
import {SkipRefinementComponent} from "../editor/refinements/skip-refinement/skip-refinement.component";
import {SeqRefinementComponent} from "../editor/refinements/seq-refinement/seq-refinement.component";
import {WhileRefinementComponent} from "../editor/refinements/while-refinement/while-refinement.component";
import {SwRefinementComponent} from "../editor/refinements/sw-refinement/sw-refinement.component";
import {CaseRefinementComponent} from "../editor/refinements/case-refinement/case-refinement.component";
import {RepeatRefinementComponent} from "../editor/refinements/repeat-refinement/repeat-refinement.component";
import { SimpleStatementComponent } from '../editor/refinements/simple-statement/simple-statement.component';
import { SelectionStatementComponent } from '../editor/refinements/selection-statement/selection-statement.component';
import { CompositionStatementComponent } from '../editor/refinements/composition-statement/composition-statement.component';

@Component({
  selector: 'app-choose-refinement',
  standalone: true,
  imports: [CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, RefinementWidgetComponent, MatDialogClose],
  templateUrl: './choose-refinement.component.html',
  styleUrl: './choose-refinement.component.scss'
})
export class ChooseRefinementComponent {
  readonly REFINEMENT_WIDGETS: {name: string, icon: string, component: Type<Refinement>}[] = [
    {name: "init", icon: "trending_flat", component: InitRefinementComponent},
    {name: "unit", icon: "swap_calls", component: UnitRefinementComponent},
    {name: "skip", icon: "clear_all", component: SkipRefinementComponent},
    {name: "seq", icon: "more_horiz", component: SeqRefinementComponent},
    {name: "while", icon: "repeat", component: WhileRefinementComponent},
    {name: "sw", icon: "flip_to_front", component: SwRefinementComponent},
    {name: "case", icon: "vertical_split", component: CaseRefinementComponent},
    {name: "repeat", icon: "autorenew", component: RepeatRefinementComponent},
    {name: "Statement", icon: "trending_flat", component: SimpleStatementComponent},
    {name: "Selection", icon: "vertical_split", component: SelectionStatementComponent},
    {name: "Composition", icon: "more_horiz", component: CompositionStatementComponent}
  ];

  constructor(public dialogRef: MatDialogRef<ChooseRefinementComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
