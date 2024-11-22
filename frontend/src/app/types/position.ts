
export interface IPosition {
    xinPx : number
    yinPx : number
}

/**
 * Class for persisting the position of the statements in the graphical editor
 */
export class Position implements IPosition {

    constructor(public xinPx : number, public yinPx : number) {}
}