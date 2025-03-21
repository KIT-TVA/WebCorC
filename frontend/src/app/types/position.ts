
/**
 * Simple Interface for defining a position on the screen
 */
export interface IPosition {
    xinPx : number
    yinPx : number
}

/**
 * Class for persisting the position of the statements in the graphical editor.
 */
export class Position implements IPosition {

    constructor(public xinPx : number, public yinPx : number) {}

    public set(position : Position) {
        this.xinPx = position.xinPx
        this.yinPx = position.yinPx
    }

    public add(offset : Position) {
        this.xinPx = this.xinPx + offset.xinPx
        this.yinPx = this.yinPx + offset.yinPx
    }
}