import {Component, ElementRef, Input, ViewChild, ViewContainerRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StatementComponent} from "../statement/statement.component";
import {Refinement} from "../../../../types/refinement";
import {TreeService} from "../../../../services/tree/tree.service";
import {MatGridListModule} from "@angular/material/grid-list";
import {RefinementWidgetComponent} from "../../../../widgets/refinement-widget/refinement-widget.component";
import {ConditionEditorComponent} from "../../condition/condition-editor/condition-editor.component";
import {Condition} from "../../../../types/condition/condition";
import {FormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDialog} from "@angular/material/dialog";
import {ChooseRefinementComponent} from "../../../choose-refinement/choose-refinement.component";
import {MatIconModule} from "@angular/material/icon";
import {LinkComponent} from "../link/link.component";
import {Position} from '../../../../types/position';
import {RepetitionStatementNode} from "../../../../types/statements/nodes/repetition-statement-node";

/**
 * Compoent in the Graphical Editor to represent an instance of {@link RepetitionStatement}
 */
@Component({
    selector: 'app-repetition-statement',
    imports: [CommonModule, StatementComponent, MatGridListModule,
        RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, LinkComponent],
    templateUrl: './repetition-statement.component.html',
    styleUrl: './repetition-statement.component.scss'
})
export class RepetitionStatementComponent extends Refinement {
    @Input({required: true}) override _node!: RepetitionStatementNode;
    private _invariantCondition: Condition;
    private _guardCondition: Condition;
    private _variantCondition: Condition;

    private _loopStatement: Refinement | undefined;
    private _loopStatementRef: ElementRef | undefined;

    @ViewChild("subComponentSpawn", {read: ViewContainerRef}) private componentSpawn!: ViewContainerRef;

    public constructor(treeService: TreeService, private dialog: MatDialog) {
        super(treeService);
        this._invariantCondition = new Condition("Invariant");
        this._variantCondition = new Condition("Variant");
        this._guardCondition = new Condition("Guard");

        // ensure to delete the loopStatement, when deleting
        treeService.deletionNotifier.subscribe(refinement => {
            if (refinement === this._loopStatement) {
                this._loopStatement = undefined;
                this._loopStatementRef!.nativeElement!.remove()
            }
        })

    }

    public override getTitle(): string {
        return "Repetition";
    }

    /**
     * Open {@link ChooseRefinementComponent} and add the child statement to the dom
     */
    public chooseRefinement() {
        const dialogRef = this.dialog.open(ChooseRefinementComponent);

        dialogRef.afterClosed().subscribe(result => {
            if (!result) {
                return
            }

            // Spawn the loop statement
            this.treeService.redrawNotifier.next()
        })
    }

    public override refreshLinkState(): void {
        super.refreshLinkState()
        if (!this.loopStatement) return
        this.loopStatement.refreshLinkState()
    }

    public override resetPosition(position: Position, offset: Position): void {
        if (offset.xinPx < 0) {
            offset.xinPx = offset.xinPx * 3.5
        }

        this.position.set(position)
        this.position.add(offset)

        this._loopStatement?.resetPosition(this.position, new Position(200, 0))
    }

    public get loopStatement(): Refinement | undefined {
        return this._loopStatement;
    }

    public set loopStatement(statement: Refinement | undefined) {
        this._loopStatement = statement
    }

    public get loopStatementRef(): ElementRef | undefined {
        return this._loopStatementRef;
    }

    public set loopStatementRef(ref: ElementRef | undefined) {
        this._loopStatementRef = ref
    }

    public get invariantCondition(): Condition {
        return this._invariantCondition;
    }

    public set invariantCondition(condition: Condition) {
        this._invariantCondition = condition
    }

    public get variantCondition(): Condition {
        return this._variantCondition;
    }

    public set variantCondition(condition: Condition) {
        this._variantCondition = condition
    }

    public get guardCondition(): Condition {
        return this._guardCondition;
    }

    public set guardCondition(condition: Condition) {
        this._guardCondition = condition
    }

    /**
     * Save the state of this component to the corresponding data only class
     * @see RepetitionStatement
     * @returns New Instance of data only Repetition Statement class
     */
    public override export() {
        return undefined
    }
}
