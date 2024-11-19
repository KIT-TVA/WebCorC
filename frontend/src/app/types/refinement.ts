import {Condition} from "./condition/condition";
import {TreeService} from "../services/tree/tree.service";
import {CdkDragEnd} from "@angular/cdk/drag-drop";
import {ReplaySubject} from "rxjs";
import {Precondition} from "./condition/precondition";
import {Postcondition} from "./condition/postcondition";
import { Position } from "./position";
import { Statement } from "./statements/statement";

/**
 * Super class Refinement of all statement components
 */
export abstract class Refinement {
  private static NEXT_ID: number = 1;

  private _id: number;
  private _precondition: Condition;
  private _postcondition: Condition;
  private _preconditionEditable : boolean = false;
  private _postconditionEditable : boolean = false;

  private _onDragMoveEmitter: ReplaySubject<void>;
  private _onDragEndEmitter: ReplaySubject<CdkDragEnd>;
  private _position: Position = new Position(0,0);

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
    return  this._preconditionEditable && this.isConditionEditable(this._precondition)
  }

  isPostConditionEditable(): boolean {
    return this._postconditionEditable && this.isConditionEditable(this._postcondition);
  }

  protected toogleEditableCondition() {
    this._preconditionEditable = !this._preconditionEditable
    this._postconditionEditable = !this._postconditionEditable
  }

  getRedrawNotifier(): ReplaySubject<void> {
    return this.treeService.redrawNotifier;
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

  set position(position : Position) {
    this._position = position
  }

  get position() : Position {
    return this._position
  }

  abstract getTitle(): string;

  /**
   * Creates a new Instance of a data only class for persisting the state
   * of the refinement without the subjects 
  */
  abstract export(): Statement | undefined

  abstract resetPosition(position : Position) : void

  /**
   * Removes variable usages of this refinement on deletion.
   */
  removeVariableUsages(): void {}


  refreshLinkState() : void {
    this._onDragMoveEmitter.next()
  }



  getBoxRowHeight(): string {
    return "120px";
  }

  getBoxWidth(): string {
    return "650px";
  }
}
