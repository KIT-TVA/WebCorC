export interface IProjectElement {
    delete() : void
    get name() : string
    get path() : string
    get content() : (IProjectElement[] | string)
    
}

export class ProjectElement implements IProjectElement {

    constructor(private _path : string, private _name : string) {}

    delete(): void {  }

    get path(): string {
        return this._path
    }

    get content(): string | IProjectElement[] {
        return ""
    }

    get name() {
        return this._name;
    }
}
