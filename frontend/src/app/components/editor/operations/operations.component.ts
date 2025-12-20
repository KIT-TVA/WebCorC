import {Component} from '@angular/core';
import {Button} from "primeng/button";
import {TreeService} from '../../../services/tree/tree.service';
import {AbstractStatementNode} from "../../../types/statements/nodes/abstract-statement-node";


@Component({
    selector: 'app-operations',
    imports: [
        Button
    ],
    templateUrl: './operations.component.html',
    styleUrl: './operations.component.scss'
})
export class OperationsComponent {

    public constructor(
        private treeservice: TreeService,
    ) { }

    //Reingold-Tilford Algorhithm
    resetNodePositionsRT(): void {
        const nodesSignal = this.treeservice.getStatementNodes();
        const nodes = nodesSignal(); // get current array
        if (nodes.length === 0) return;

        const NODE_WIDTH = 450;
        const NODE_HEIGHT = 300;
        const H_SPACING = 50;
        const V_SPACING = 200;

        const root = nodes.find(n => n.parent === undefined);
        if (!root) return;

        const xMap = new Map<AbstractStatementNode, number>();
        const depthMap = new Map<AbstractStatementNode, number>();

        const definedChildren = (node: AbstractStatementNode): AbstractStatementNode[] =>
            node.children.filter((c): c is AbstractStatementNode => c !== undefined);

        let nextSlot = 0;
        const firstWalk = (node: AbstractStatementNode, depth: number) => {
            depthMap.set(node, depth);
            const children = definedChildren(node);
            if (children.length === 0) {
                xMap.set(node, nextSlot++);
                return;
            }
            for (const child of children) firstWalk(child, depth + 1);
            const left = xMap.get(children[0]);
            const right = xMap.get(children[children.length - 1]);
            xMap.set(node, (left! + right!) / 2);
        };

        const secondWalk = (node: AbstractStatementNode) => {
            const slot = xMap.get(node)!;
            const depth = depthMap.get(node)!;
            node.setPosition({
                x: slot * (NODE_WIDTH + H_SPACING),
                y: depth * (NODE_HEIGHT + V_SPACING),
            });
            for (const child of definedChildren(node)) secondWalk(child);
        };

        firstWalk(root, 0);
        secondWalk(root);

        this.treeservice.refreshNodes();
    }

    //Stacked Algorhithm
    resetNodePositionsStacked(): void {
        const nodesSignal = this.treeservice.getStatementNodes();
        const nodes = nodesSignal();
        if (nodes.length === 0) return;

        const NODE_WIDTH = 300;
        const NODE_HEIGHT = 450;
        const H_SPACING = 50;
        const V_SPACING = 200;

        const layerMap = new Map<number, AbstractStatementNode[]>();

        const traverse = (node: AbstractStatementNode, depth: number) => {
            if (!layerMap.has(depth)) layerMap.set(depth, []);
            layerMap.get(depth)!.push(node);

            for (const child of node.children.filter((c): c is AbstractStatementNode => c !== undefined)) {
                traverse(child, depth + 1);
            }
        };

        const root = nodes.find(n => n.parent === undefined);
        if (!root) return;

        traverse(root, 0);

        layerMap.forEach((layerNodes, depth) => {
            layerNodes.forEach((node, index) => {
                node.setPosition({
                    x: index * (NODE_WIDTH + H_SPACING),
                    y: depth * (NODE_HEIGHT + V_SPACING),
                });
            });
        });

        this.treeservice.refreshNodes();
    }


}
