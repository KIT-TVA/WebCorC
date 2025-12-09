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
    ) {
    }

    resetNodePositions() {
        const root = this.treeservice.rootStatement
        if (!root) {return}
        let currentNode: AbstractStatementNode | undefined = root
    }
}
