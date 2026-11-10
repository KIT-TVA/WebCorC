import { Component, inject } from "@angular/core";

import { MatButtonModule } from "@angular/material/button";
import { TreeService } from "../../../services/tree/tree.service";
import { MatIconModule } from "@angular/material/icon";
import { GraphLayoutService } from "../../../services/tree/layout/graph-layout.service";

/**
 * Options and Actions Component for the Editor Component
 * shown in the expand panel
 */
@Component({
  selector: "app-options",
  imports: [MatButtonModule, MatIconModule],
  templateUrl: "./options.component.html",
  standalone: true,
  styleUrl: "./options.component.css",
})
export class OptionsComponent {
  private treeService = inject(TreeService);
  private graphLayoutService = inject(GraphLayoutService);

  /**
   * Function executed on clicking Reset Positions
   */
  public resetPositions() {
    this.graphLayoutService.resetNodePositions();
  }

  /**
   * Function executed on clicking export Graph
   */
  public exportGraph() {
    this.treeService.export();
  }
}
