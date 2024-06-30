import {Component, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {TreeService} from "../../../services/tree/tree.service";
import {MatTable, MatTableModule} from "@angular/material/table";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {FormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {EXPLICIT, QbCVariable, SYMBOLIC} from "../../../translation/variables";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";

@Component({
  selector: 'app-variables',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonToggleModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './variables.component.html',
  styleUrl: './variables.component.scss'
})
export class VariablesComponent {
  @ViewChild(MatTable)
  table!: MatTable<QbCVariable>

  constructor(public treeService: TreeService) {
    treeService.variablesChangedNotifier.subscribe(() => {
      this.table.renderRows();
    });
  }

  protected readonly EXPLICIT = EXPLICIT;
  protected readonly SYMBOLIC = SYMBOLIC;

  moveVariable(variable: QbCVariable, up: boolean): void {
    this.treeService.moveVariable(variable, up);
  }
}
