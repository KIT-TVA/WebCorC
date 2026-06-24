import { Component, OnDestroy, inject } from "@angular/core";

import { MatButtonModule } from "@angular/material/button";
import { TreeService } from "../../../services/tree/tree.service";
import { ProjectService } from "../../../services/project/project.service";
import { first, Subscription } from "rxjs";
import { EditorService } from "../../../services/editor/editor.service";
import { MatIconModule } from "@angular/material/icon";

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
export class OptionsComponent implements OnDestroy {
  private treeService = inject(TreeService);
  private projectService = inject(ProjectService);
  private editorService = inject(EditorService);

  private subscriptions: Subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Function executed on clicking Reset Positions
   */
  public resetPositions() {
    //TODO: Reimplement
    this.subscriptions.add(
      this.projectService.explorerNotify.pipe(first()).subscribe(() => {
        this.editorService.reload.next();
      }),
    );

    this.projectService.editorNotify.next();
  }

  /**
   * Function executed on clicking export Graph
   */
  public exportGraph() {
    this.treeService.export();
  }
}
