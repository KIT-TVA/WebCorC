import {TreeService} from "../services/tree/tree.service";
import {ReplaySubject} from "rxjs";
import {Position} from "./position";
import {AbstractStatement} from "./statements/abstract-statement";

/**
 * Super class Refinement of all statement components
 */
export abstract class Refinement {
    private _proven: boolean = false

    private _onDragMoveEmitter: ReplaySubject<void>
    private _position: Position = new Position(0, 0)

    protected constructor(protected treeService: TreeService) {
        this._onDragMoveEmitter = new ReplaySubject<void>()
    }

    public get position(): Position {
        return this._position
    }

    public set position(value: Position) {
        this._position = value
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
}
