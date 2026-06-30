import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnInit,
  output,
} from "@angular/core";
import { ConditionEditorComponent } from "../condition-editor/condition-editor.component";
import { AbstractStatementNode } from "../../../../types/statements/nodes/abstract-statement-node";
import { ICondition } from "../../../../types/condition/condition";
import { Button } from "primeng/button";
import {
  GREEN_COLOURED_CONDITIONS,
  RED_COLOURED_CONDITIONS,
} from "../../editor.component";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "app-condition-selector",
  imports: [ConditionEditorComponent, Button],
  templateUrl: "./condition-selector.component.html",
  styleUrl: "./condition-selector.component.css",
})
export class ConditionSelectorComponent implements AfterViewInit, OnInit {
  @Input()
  set parent(value: AbstractStatementNode) {
    this._parent = value;
    this.updateConflicts();
  }
  get parent(): AbstractStatementNode {
    return this._parent;
  }
  private _parent!: AbstractStatementNode;

  @Input()
  set child(value: AbstractStatementNode) {
    this._child = value;
    this.updateConflicts();
  }
  get child(): AbstractStatementNode {
    return this._child;
  }
  private _child!: AbstractStatementNode;

  selectCondition = output();

  protected conflicts: {
    version1: BehaviorSubject<ICondition>;
    version2: BehaviorSubject<ICondition>;
    type: "PRECONDITION" | "POSTCONDITION";
  }[] = [];

  constructor(
    @Inject(GREEN_COLOURED_CONDITIONS) protected greenConditions: ICondition[],
    @Inject(RED_COLOURED_CONDITIONS) protected redConditions: ICondition[],
  ) {}

  ngOnInit(): void {
    // Initialization is handled by the input setters
  }

  ngAfterViewInit(): void {
    this.updateConflicts();
  }

  updateConflicts() {
    if (!this.parent || !this.child) {
      return;
    }

    this.conflicts = this.parent.getConditionConflicts(this.child);
  }

  setActiveCondition(accept: ICondition, remove: ICondition) {
    this.redConditions.push(remove);
    this.greenConditions.push(accept);
  }

  public removeActiveCondition() {
    this.greenConditions.pop();
    this.redConditions.pop();
  }

  public _selectCondition(
    parent: boolean,
    conflict: {
      version1: BehaviorSubject<ICondition>;
      version2: BehaviorSubject<ICondition>;
      type: "PRECONDITION" | "POSTCONDITION";
    },
  ) {
    if (parent) {
      if (conflict.type == "PRECONDITION") {
        this.child.overridePrecondition(conflict.version1);
      } else {
        this.child.overridePostcondition(conflict.version1);
      }
    } else {
      if (conflict.type == "PRECONDITION") {
        const childCond = conflict.version2.getValue();
        conflict.version1.next(childCond);
        this.child.overridePrecondition(conflict.version1);
      } else {
        const childCond = conflict.version2.getValue();
        conflict.version1.next(childCond);
        this.child.overridePostcondition(conflict.version1);
      }
    }
    this.selectCondition.emit();
  }
}
