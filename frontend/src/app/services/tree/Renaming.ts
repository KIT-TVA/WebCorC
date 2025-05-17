/**
 * Data only representation of renaming object.
 */
export interface IRenaming {
    type : string
    function : string
    newName : string
}

/**
 * Data only representation of renaming object.
 * @see IRenaming
 */
export class Renaming implements IRenaming {
    public type: string
    public function: string
    public newName: string

    constructor(type : string, _function : string, newName : string) {
        this.type = type
        this.function = _function
        this.newName = newName
    }

    public equal(other : Renaming) : boolean {
        return this.type === other.type && this.function === other.function && this.newName === other.newName
    }

}