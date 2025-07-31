import {Component, ElementRef, Input} from '@angular/core';
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
import {Position} from '../../../../types/position';
import {SkipStatementNode} from "../../../../types/statements/nodes/skip-statement-node";

/**
 * Component in the graphic editor representing {@link StrongWeakStatement}
 */
@Component({
    selector: 'app-strong-weak-statement',
    imports: [CommonModule, StatementComponent, MatGridListModule,
        RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
    templateUrl: './strong-weak-statement.component.html',
    standalone: true,
    styleUrl: './strong-weak-statement.component.scss'
})
export class StrongWeakStatementComponent extends Refinement {
    private _weakPreCondition: Condition;
    private _strongPostCondition: Condition;

    private _statement: Refinement | undefined;
    @Input({required: true}) _node!: SkipStatementNode;
    private _statementRef: ElementRef | undefined;

    public constructor(treeService: TreeService, private dialog: MatDialog) {
        super(treeService);
        this._weakPreCondition = new Condition("Weak precondition");
        this._strongPostCondition = new Condition("Strong postcondition");
    }

    public override getTitle(): string {
        return "Strong-Weak"
    }

    /**
     * Open {@link ChooseRefinementComponent} and allow adding a child to this statement
     */
    public chooseRefinement() {
        const dialogRef = this.dialog.open(ChooseRefinementComponent);

        dialogRef.afterClosed().subscribe(result => {
            if (!result) {
                return
            }
            //TODO: Spawn subcomponent
        })
    }


    /**
     * Convert this Component to the data only {@link StrongWeakStatement}
     * @returns
     */
    public override export() {
        return undefined
    }

    /**
     * Refresh the link between this and the child statement
     */
    public override refreshLinkState(): void {
        super.refreshLinkState()
        if (!this._statement) return
        this.statement?.refreshLinkState()
    }


    public override resetPosition(position: Position, offset: Position): void {
        this.position.set(position)
        this.position.add(offset)

        this._statement?.resetPosition(this.position, new Position(100, 0))
    }

    public get statement(): Refinement | undefined {
        return this._statement
    }

    public set statement(statement: Refinement | undefined) {
        this._statement = statement
    }

    public get statementRef(): ElementRef | undefined {
        return this._statementRef
    }

    public set statementRef(ref: ElementRef | undefined) {
        this._statementRef = ref
    }


    public get weakPreCondition(): Condition {
        return this._weakPreCondition
    }

    public get strongPostCondition(): Condition {
        return this._strongPostCondition;
    }
}
