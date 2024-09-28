import { Inode } from "../../types/project/inode";
import { CBCFormula } from "./CBCFormula";


/**
 * Interface to implement for a Element in the Filetree of a project
 */
export interface IProjectElement {
    delete() : void
    export() : Inode
    get name() : string
    get path() : string
    get content() : (IProjectElement[] | CBCFormula | string)
    set content(content : CBCFormula | string)
    
}

/**
 * Default implementation of @see IProjectElement
 */
export abstract class ProjectElement implements IProjectElement {

    constructor(private _path : string, private _name : string) {}

    delete(): void {  }
    abstract export(): Inode;

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
