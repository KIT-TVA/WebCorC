import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TreeService } from '../../../services/tree/tree.service';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss'
})
export class OptionsComponent {

  constructor(private treeService : TreeService) {}


  public resetPositions() {
    this.treeService.resetPositions()
  }

}
