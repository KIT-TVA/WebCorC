import {Condition} from "./condition/condition";
import {TreeService} from "../services/tree/tree.service";
import {CdkDragEnd} from "@angular/cdk/drag-drop";
import {ReplaySubject} from "rxjs";
import {Precondition} from "./condition/precondition";
import {Postcondition} from "./condition/postcondition";

export abstract class Refinement {
  private static NEXT_ID: number = 1;

  private _id: number;
  private _precondition: Condition;
  private _postcondition: Condition;

  private _onDragMoveEmitter: ReplaySubject<void>;
  private _onDragEndEmitter: ReplaySubject<CdkDragEnd>;

  protected constructor(protected treeService: TreeService) {
    this._id = Refinement.NEXT_ID++;
    this._precondition = new Precondition(this._id);
    this._postcondition = new Postcondition(this._id);

    if (this._id === 1) {
      this.treeService.rootNode = this;
    }

    this._onDragMoveEmitter = new ReplaySubject<void>();
    this._onDragEndEmitter = new ReplaySubject<CdkDragEnd>();
  }

  public static resetIDs(next: number = 1): void {
    this.NEXT_ID = next;
  }

  isConditionEditable(condition: Condition): boolean {
    return this._id === condition.originId;
  }

  isPreconditionEditable(): boolean {
    return this.isConditionEditable(this._precondition);
  }

  isPostConditionEditable(): boolean {
    return this.isConditionEditable(this._postcondition);
  }

  getScrollNotifier(): ReplaySubject<void> {
    return this.treeService.scrollNotifier;
  }

  get id(): number {
    return this._id;
  }

  get precondition(): Condition {
    return this._precondition;
  }

  get postcondition(): Condition {
    return this._postcondition;
  }

  get onDragMoveEmitter(): ReplaySubject<void> {
    return this._onDragMoveEmitter;
  }

  get onDragEndEmitter(): ReplaySubject<CdkDragEnd> {
    return this._onDragEndEmitter;
  }

  set precondition(value: Condition) {
    this._precondition = value;
  }

  set postcondition(value: Condition) {
    this._postcondition = value;
  }

  abstract getTitle(): string;

  /**
   * Removes variable usages of this refinement on deletion.
   */
  removeVariableUsages(): void {}

  /**
   * Generates the JSON object containing this refinement object.
   * Every refinement contains the pre- and postcondition. However, some add further
   * attributes.
   */
  export(): any {
    return {
      refinementType: this.getTitle(),
      id: this.id,
      precondition: this.precondition.export(),
      postcondition: this.postcondition.export()
    };
  }

  getBoxRowHeight(): string {
    return "120px";
  }

  getBoxWidth(): string {
    return "650px";
  }
}
