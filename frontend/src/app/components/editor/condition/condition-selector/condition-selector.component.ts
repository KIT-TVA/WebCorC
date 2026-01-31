import {
  AfterViewInit,
  Component,
  effect,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  output,
  signal,
  WritableSignal,
  Injector,
  runInInjectionContext,
} from "@angular/core";
import { ConditionEditorComponent } from "../condition-editor/condition-editor.component";
import { AbstractStatementNode } from "../../../../types/statements/nodes/abstract-statement-node";
import { ICondition } from "../../../../types/condition/condition";
import { Button } from "primeng/button";
import {
  GREEN_COLOURED_CONDITIONS,
  RED_COLOURED_CONDITIONS,
} from "../../editor.component";
import { BehaviorSubject, Subscription } from "rxjs";

@Component({
  selector: "app-condition-selector",
  imports: [ConditionEditorComponent, Button],
  templateUrl: "./condition-selector.component.html",
  styleUrl: "./condition-selector.component.css",
})
export class ConditionSelectorComponent implements AfterViewInit, OnInit, OnDestroy {
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

  conflictSignals: {
    version1: WritableSignal<ICondition>;
    version2: WritableSignal<ICondition>;
    type: "PRECONDITION" | "POSTCONDITION";
  }[] = [];

  private subscriptions = new Subscription();

  constructor(
    @Inject(GREEN_COLOURED_CONDITIONS) protected greenConditions: ICondition[],
    @Inject(RED_COLOURED_CONDITIONS) protected redConditions: ICondition[],
    private injector: Injector,
  ) {
    effect(() => {
      this.conflictSignals.forEach((conflictSignal, i) => {
        const conflict = this.conflicts[i];
        if (conflict && conflict.version1.getValue() !== conflictSignal.version1()) {
          conflict.version1.next(conflictSignal.version1());
        }
        if (conflict && conflict.version2.getValue() !== conflictSignal.version2()) {
          conflict.version2.next(conflictSignal.version2());
        }
      });
    });
  }

  ngOnInit(): void {
    // Initialization is handled by the input setters
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.updateConflicts();
  }

  updateConflicts() {
    if (!this.parent || !this.child) {
      return;
    }

    this.conflicts = this.parent.getConditionConflicts(this.child);

    runInInjectionContext(this.injector, () => {
      this.conflictSignals = this.conflicts.map(conflict => ({
        version1: signal(conflict.version1.getValue()),
        version2: signal(conflict.version2.getValue()),
        type: conflict.type,
      }));
    });

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();

    this.conflicts.forEach((conflict, i) => {
      this.subscriptions.add(conflict.version1.subscribe(value => {
        if (this.conflictSignals[i] && this.conflictSignals[i].version1() !== value) {
          this.conflictSignals[i].version1.set(value);
        }
      }));
      this.subscriptions.add(conflict.version2.subscribe(value => {
        if (this.conflictSignals[i] && this.conflictSignals[i].version2() !== value) {
          this.conflictSignals[i].version2.set(value);
        }
      }));
    });
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
