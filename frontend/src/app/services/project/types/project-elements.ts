import { CBCFormula } from "../CBCFormula";

/**
 * Interface to implement for a Element in the Filetree of a project
 */
export interface IProjectElement {
    delete() : void
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

    move(target : ProjectDirectory) : void {
        this._path = target.path + this.name
        target.addElement(this)
    }

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


/**
 * Represents a directory in the project, which includes more Projectelements as childs 
 */
export class ProjectDirectory extends ProjectElement {


    constructor(_parentpath : string, name : string, private _elements : ProjectElement[] = []) {
        super(_parentpath + name + "/", name)
    }

    override delete(): void {
        this._elements.forEach(element => {
            element.delete()
        })
        
        this._elements = []
    }

    addElement(element : ProjectElement) : boolean  {
        for (const existingElement of this._elements) {
            if (existingElement.name == element.name) {return false;}
        }

        if (element instanceof ProjectDirectory) {
            this._elements.unshift(element)
        } else {
            this._elements.push(element)
        }

        return true;
    }

    removeElement(elementName : string) {
        this._elements = this._elements.filter(val => val.name != elementName)
    }

    override get content() : (ProjectElement[]) {
        return this._elements
    }

    override move(target: ProjectDirectory): void {
        super.move(target)

        //this._elements.forEach((child : ProjectElement) => child.move(this))
    }
}


export const fakeProjectElementName = "...new"

/**
 * This Child of the Projectelement is used to display new file input in the tree at the desired 
 * location of the user
 */
export class FakeProjectElement extends ProjectElement {

    constructor(_parentpath : string) {
        super(_parentpath, fakeProjectElementName)
    }

}

/**
 * Represents the files edited in the @see FileEditorComponent, which is text based
 * 
 */
export class CodeFile extends ProjectElement {

    constructor(_parentpath : string, name : string, public type : string = "java", private _content : string = "") {
        super(_parentpath + name + "." + type, name + "." + type)
    }

    override get content() : string {
        return this._content
    }

    override set content(content : string) {
        this._content = content
    }
}

/**
 * Represents the files edited in the @see EditorComponent, which is graph based
 */
export class DiagramFile extends ProjectElement {


    constructor(private _parentpath : string, name : string, public type : string = "diagram", private _content : CBCFormula = new CBCFormula() ) {
        super(_parentpath + name + "." + type, name + "." + type)
    }

    override get content() : CBCFormula {
        return this._content
    }

    override set content(content : CBCFormula) {
        this._content = content
    }
}