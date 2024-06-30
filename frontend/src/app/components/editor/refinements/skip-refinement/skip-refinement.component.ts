import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RefinementComponent} from "../refinement/refinement.component";
import {Refinement} from "../../../../types/refinement";
import {TreeService} from "../../../../services/tree/tree.service";

@Component({
  selector: 'app-skip-refinement',
  standalone: true,
  imports: [CommonModule, RefinementComponent],
  templateUrl: './skip-refinement.component.html',
  styleUrl: './skip-refinement.component.scss'
})
export class SkipRefinementComponent extends Refinement {
  constructor(treeService: TreeService) {
    super(treeService);
  }

  override getTitle(): string {
    return "skip";
  }
}
