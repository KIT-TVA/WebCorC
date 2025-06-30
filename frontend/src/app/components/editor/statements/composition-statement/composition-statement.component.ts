import {Component, ElementRef, Input, OnInit} from '@angular/core';
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
import {AbstractStatement, IAbstractStatement} from '../../../../types/statements/abstract-statement';
import {Position} from '../../../../types/position';
import {CompositionStatementNode} from "../../../../types/statements/nodes/composition-statement-node";
import {createEmptyStatementNode} from "../../../../types/statements/nodes/createStatementNode";

/**
 * Composition statement in {@link EditorComponent}.
 * The compositon statement propagates the precondition to the left statement and the postcondition to the right statement.
 * The intermediate condition is the post condition of the left statement and the precondition of the right statement. 
 * The Composition Statement gets saved as {@link CompositionStatement}
 */
@Component({
    selector: 'app-composition-statement',
  imports: [CommonModule, StatementComponent, MatGridListModule,
    RefinementWidgetComponent, ConditionEditorComponent, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
    templateUrl: './composition-statement.component.html',
    styleUrl: './composition-statement.component.scss'
})
export class CompositionStatementComponent extends Refinement implements OnInit {
  @Input({required: true}) _node! : CompositionStatementNode;

  private _leftStatement : IAbstractStatement | undefined;
  private _rightStatement : IAbstractStatement | undefined;
  private _intermediateCondition : Condition;

  /**
   * Native HTML Elements of the statements, used for visual deletion of the child elements
   */
  private _leftStatementRef : ElementRef | undefined;
  private _rightStatementRef : ElementRef | undefined;

  // Element used to spawn the child statements in

  public constructor(treeService : TreeService, private dialog : MatDialog) {
    super(treeService);
    this._intermediateCondition = new Condition("Intermediate Cond.")
  }

  ngOnInit() {
    this._leftStatement = this._node.statement.firstStatement;
    this._rightStatement = this._node.statement.secondStatement;
  }
  
  public override getTitle(): string {
    return "Composition"
  }

  /**
   * Add the child statements chosen by the user in {@link ChooseRefinementComponent} .
   * The new child statement then get created in component
   * @param side hardcoded string from the template to identify which button got used
   */
  public chooseRefinement(side : "left" | "right") : void {
    const dialogRef = this.dialog.open(ChooseRefinementComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return
      }

      this.treeService.addStatementNode(createEmptyStatementNode(result, this._node));
      console.log(result)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars

      if (side === "left") {
        //TODO Spawn statement on the left
      } else {
        //TODO Spawn statement on the right
      }

      this.treeService.redrawNotifier.next() //TODO This may be redundant soon
    })
  }

  public override resetPosition(position : Position, offset : Position): void {
    this.position.set(position)
    this.position.add(offset)

    //TODO do for all substatements
  }


  public get leftStatement()  {
    return this._leftStatement
  }

  public get rightStatement() {
    return this._rightStatement
  }

  public get intermediateCondition() : Condition {
    return this._intermediateCondition
  }
  
  public set intermediateCondition(condition : Condition) {
    this._intermediateCondition = condition
  } 
 
  /**
   * Converts this component to the data only CompositionStatment {@link CompositionStatement}
   * @returns a new Instance of CompositionStatment
   */
  public override export() : AbstractStatement | undefined {
    //TODO
    return undefined
  }
}
