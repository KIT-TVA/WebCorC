import { Injectable, inject } from "@angular/core";
import { TreeService } from "../tree.service";
import { GlobalSettingsService } from "../../global-settings.service";
import { ResetVariant } from "../../../types/ResetVariant";
import { AbstractStatementNode } from "../../../types/statements/nodes/abstract-statement-node";

/**
 * Service to (re)arrange the statement nodes of the graphical editor.
 */
@Injectable({
  providedIn: "root",
})
export class GraphLayoutService {
  private treeService = inject(TreeService);
  private globalSettingsService = inject(GlobalSettingsService);

  /**
   * Reset the positions of all statement nodes using the layout algorithm
   * selected in the global settings.
   */
  public resetNodePositions(): void {
    switch (this.globalSettingsService.resetVariant()) {
      case ResetVariant.Stacked:
        this.resetNodePositionsStacked();
        break;
      case ResetVariant.ReingoldTilford:
      default:
        this.resetNodePositionsRT();
        break;
    }
  }

  /**
   * Reingold-Tilford-like layout: leaves get consecutive slots,
   * parents are centered above their children.
   */
  public resetNodePositionsRT(): void {
    const root = this.getRoot();
    if (!root) return;

    const NODE_WIDTH = 450;
    const NODE_HEIGHT = 300;
    const H_SPACING = 50;
    const V_SPACING = 200;

    const xMap = new Map<AbstractStatementNode, number>();
    const depthMap = new Map<AbstractStatementNode, number>();

    let nextSlot = 0;
    const firstWalk = (node: AbstractStatementNode, depth: number) => {
      depthMap.set(node, depth);
      const children = definedChildren(node);
      if (children.length === 0) {
        xMap.set(node, nextSlot++);
        return;
      }
      for (const child of children) firstWalk(child, depth + 1);
      const left = xMap.get(children[0])!;
      const right = xMap.get(children[children.length - 1])!;
      xMap.set(node, (left + right) / 2);
    };

    const secondWalk = (node: AbstractStatementNode) => {
      node.setPosition({
        x: xMap.get(node)! * (NODE_WIDTH + H_SPACING),
        y: depthMap.get(node)! * (NODE_HEIGHT + V_SPACING),
      });
      for (const child of definedChildren(node)) secondWalk(child);
    };

    firstWalk(root, 0);
    secondWalk(root);

    this.treeService.refreshNodes();
  }

  /**
   * Stacked layout: nodes of the same depth are placed next to each other in one row.
   */
  public resetNodePositionsStacked(): void {
    const root = this.getRoot();
    if (!root) return;

    const NODE_WIDTH = 300;
    const NODE_HEIGHT = 450;
    const H_SPACING = 50;
    const V_SPACING = 200;

    const layerMap = new Map<number, AbstractStatementNode[]>();

    const traverse = (node: AbstractStatementNode, depth: number) => {
      if (!layerMap.has(depth)) layerMap.set(depth, []);
      layerMap.get(depth)!.push(node);
      for (const child of definedChildren(node)) traverse(child, depth + 1);
    };

    traverse(root, 0);

    layerMap.forEach((layerNodes, depth) => {
      layerNodes.forEach((node, index) => {
        node.setPosition({
          x: index * (NODE_WIDTH + H_SPACING),
          y: depth * (NODE_HEIGHT + V_SPACING),
        });
      });
    });

    this.treeService.refreshNodes();
  }

  private getRoot(): AbstractStatementNode | undefined {
    const nodes = this.treeService.generateStatementNodes()();
    return nodes.find((n) => n.parent === undefined);
  }
}

function definedChildren(node: AbstractStatementNode): AbstractStatementNode[] {
  return node.children.filter(
    (c): c is AbstractStatementNode => c !== undefined,
  );
}
