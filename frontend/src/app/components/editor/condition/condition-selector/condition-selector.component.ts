import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  output,
  WritableSignal,
} from "@angular/core";
import { ConditionEditorComponent } from "../condition-editor/condition-editor.component";
import { AbstractStatementNode } from "../../../../types/statements/nodes/abstract-statement-node";
import { ICondition } from "../../../../types/condition/condition";
import { Button } from "primeng/button";
import {
  GREEN_COLOURED_CONDITIONS,
  RED_COLOURED_CONDITIONS,
} from "../../editor.component";

@Component({
  selector: "app-condition-selector",
  imports: [ConditionEditorComponent, Button],
  templateUrl: "./condition-selector.component.html",
  styleUrl: "./condition-selector.component.css",
})
export class ConditionSelectorComponent implements AfterViewInit {
  @Input({ required: true })
  parent!: AbstractStatementNode;
  @Input({ required: true })
  child!: AbstractStatementNode;
  selectCondition = output();
  protected conflicts: {
    version1: WritableSignal<ICondition>;
    version2: WritableSignal<ICondition>;
    type: "PRECONDITION" | "POSTCONDITION";
  }[] = [];
  constructor(
    @Inject(GREEN_COLOURED_CONDITIONS) protected greenConditions: ICondition[],
    @Inject(RED_COLOURED_CONDITIONS) protected redConditions: ICondition[],
  ) {}

  ngAfterViewInit(): void {
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

  /**
   *
   * @param parent whether the condition we are choosing comes from the parent
   * @param conflict
   */
  public _selectCondition(
    parent: boolean,
    conflict: {
      version1: WritableSignal<ICondition>;
      version2: WritableSignal<ICondition>;
      type: "PRECONDITION" | "POSTCONDITION";
    },
  ) {
    if (parent) {
      if (conflict.type == "PRECONDITION") {
        this.child.overridePrecondition(conflict.version1);
      } else {
        this.child.postcondition.set(conflict.version1());
        this.parent.overridePostcondition(this.child.postcondition);
      }
    } else {
      if (conflict.type == "PRECONDITION") {
        const overriddenCondition = conflict.version2();
        this.child.overridePrecondition(conflict.version1);
        this.child.precondition.set(overriddenCondition);
      } else {
        this.parent.overridePostcondition(conflict.version2);
      }
    }
    this.selectCondition.emit();
  }
}
