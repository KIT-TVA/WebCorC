import {TreeService} from "../services/tree/tree.service";
import {CdkDragEnd} from "@angular/cdk/drag-drop";
import {ReplaySubject} from "rxjs";
import {Position} from "./position";
import {AbstractStatement} from "./statements/abstract-statement";

/**
 * Super class Refinement of all statement components
 */
export abstract class Refinement {
    private _preconditionEditable: boolean = false
    private _postconditionEditable: boolean = false
    private _proven: boolean = false

    private _onDragMoveEmitter: ReplaySubject<void>
    private _onDragEndEmitter: ReplaySubject<CdkDragEnd>
    private _position: Position = new Position(0, 0)

    protected constructor(protected treeService: TreeService) {
        this._onDragMoveEmitter = new ReplaySubject<void>()
        this._onDragEndEmitter = new ReplaySubject<CdkDragEnd>()
    }

    protected toggleEditableCondition() {
        this._preconditionEditable = !this._preconditionEditable
        this._postconditionEditable = !this._postconditionEditable
    }

    public getRedrawNotifier(): ReplaySubject<void> {
        return this.treeService.redrawNotifier;
    }

    public get onDragMoveEmitter(): ReplaySubject<void> {
        return this._onDragMoveEmitter;
    }

    public get onDragEndEmitter(): ReplaySubject<CdkDragEnd> {
        return this._onDragEndEmitter;
    }

    public set position(position: Position) {
        this._position = position
    }

    public get position(): Position {
        return this._position
    }

    public set proven(value: boolean) {
        this._proven = value
    }

    public get proven() {
        return this._proven
    }

    public abstract getTitle(): string;

    /**
     * Creates a new Instance of a data only class for persisting the state
     * of the refinement without the subjects
     */
    abstract export(): AbstractStatement | undefined

    abstract resetPosition(position: Position, offset: Position): void


    public refreshLinkState(): void {
        this._onDragMoveEmitter.next()
    }


    public getBoxRowHeight(): string {
        return "120px";
    }

    public getBoxWidth(): string {
        return "650px";
    }
}
