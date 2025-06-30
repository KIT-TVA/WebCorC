import {Component, ElementRef, Input, ViewChild, ViewContainerRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StatementComponent} from "../statement/statement.component";
import {Refinement} from "../../../../types/refinement";
import {TreeService} from "../../../../services/tree/tree.service";
import {MatGridListModule} from "@angular/material/grid-list";
import {RefinementWidgetComponent} from "../../../../widgets/refinement-widget/refinement-widget.component";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {FormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDialog} from "@angular/material/dialog";
import {ChooseRefinementComponent} from "../../../choose-refinement/choose-refinement.component";
import {MatIconModule} from "@angular/material/icon";
import {LinkComponent} from "../link/link.component";
import {Position} from '../../../../types/position';
import {AbstractStatement} from "../../../../types/statements/abstract-statement";
import {SimpleStatementNode} from "../../../../types/statements/nodes/simple-statement-node";

/**
 * Component representing an instande of {@link SimpleStatement} in the grahical editor.
 * The Root statement is also a simple statement, with one child element
 */
@Component({
    selector: 'app-simple-statement',
    imports: [CommonModule, StatementComponent, MatGridListModule,
        RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, LinkComponent, ConditionEditorComponent],
    templateUrl: './simple-statement.component.html',
    styleUrl: './simple-statement.component.scss'
})
export class SimpleStatementComponent extends Refinement {
    override export(): AbstractStatement | undefined {
        throw new Error('Method not implemented.');
    }
    private _statement: Refinement | undefined;

    private _statementElementRef: ElementRef | undefined;

    @Input({required: true}) _node! : SimpleStatementNode;

    @ViewChild("subComponentSpawn", {read: ViewContainerRef}) private componentSpawn!: ViewContainerRef;

    public constructor(treeService: TreeService, private dialog: MatDialog) {
        super(treeService);

        // If root enable the conditions to be edited
        if (this.isRoot()) {
            super.toggleEditableCondition()
        }
    }

    public override getTitle(): string {
        return this.isRoot() ? "Root" : "Statement";
    }


    public chooseRefinement(): void {
        if (!this.isRoot()) {
            return
        }

        const dialogRef = this.dialog.open(ChooseRefinementComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (!result) {
                return
            }

            this.componentSpawn.createComponent(result);
            //TODO: check if dependencies changed for conditions
        })
    }

    public override refreshLinkState(): void {
        super.refreshLinkState()

        if (this._statement) {
            this._statement.refreshLinkState()
        }
    }

    public override resetPosition(position: Position, offset: Position): void {
        this.position.set(position)
        this.position.add(offset)

        if (this._statement) {
            this._statement.resetPosition(this.position, new Position(100, -10))
        }
    }

    public isRoot(): boolean {
        return this.treeService.isRootNode(this);
    }


    public get statement(): Refinement | undefined {
        return this._statement
    }

    public set statement(statement: Refinement | undefined) {
        this._statement = statement
    }

    public get statementElementRef() {
        return this._statementElementRef
    }

    public set statementElementRef(ref: ElementRef | undefined) {
        this._statementElementRef = ref
    }
}
