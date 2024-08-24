import { CBCFormula } from "./CBCFormula";

export interface IProjectElement {
    delete() : void
    get name() : string
    get path() : string
    get content() : (IProjectElement[] | CBCFormula | string)
    set content(content : CBCFormula | string)
    
}

export class ProjectElement implements IProjectElement {

    constructor(private _path : string, private _name : string) {}

    delete(): void {  }

    get path(): string {
        return this._path
    }

    get content(): string | CBCFormula | IProjectElement[] {
        return ""
    }

    set content(content : CBCFormula | string) {
        
    }

    get name() {
        return this._name;
    }

}
