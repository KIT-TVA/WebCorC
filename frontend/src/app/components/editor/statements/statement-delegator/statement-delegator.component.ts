import {Component, Input} from '@angular/core';
import {IAbstractStatement} from "../../../../types/statements/abstract-statement";
import {CompositionStatementComponent} from "../composition-statement/composition-statement.component";
import {StrongWeakStatementComponent} from "../strong-weak-statement/strong-weak-statement.component";
import {RepetitionStatementComponent} from "../repetition-statement/repetition-statement.component";
import {SelectionStatementComponent} from "../selection-statement/selection-statement.component";
import {SimpleStatementComponent} from "../simple-statement/simple-statement.component";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-statement-delegator',
  imports: [
    CompositionStatementComponent,
    StrongWeakStatementComponent,
    RepetitionStatementComponent,
    SelectionStatementComponent,
    SimpleStatementComponent,
    NgIf
  ],
  templateUrl: './statement-delegator.component.html',
  styleUrl: './statement-delegator.component.scss'
})
export class StatementDelegatorComponent {
  @Input() statement!: IAbstractStatement
}
