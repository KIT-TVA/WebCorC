import { CBCFormula } from "../CBCFormula";

/**
 * Interface to implement for a Element in the Filetree of a project
 */
export interface IProjectElement {
    delete() : void
    move(target : ProjectDirectory, name : string) : boolean
    toggleRename() : void
    get name() : string
    get path() : string
    get content() : (IProjectElement[] | CBCFormula | string)
    set content(content : CBCFormula | string)
    get getsRenamed() : boolean
    
}

/**
 * Default implementation of @see IProjectElement
 */
export abstract class ProjectElement implements IProjectElement {
    private _rename : boolean = false

    public constructor(private _path : string, private _name : string) {}

    public delete(): void {  }

    public move(target : ProjectDirectory, name : string = this._name) : boolean {
        if (target.path == '/') {
            this._path = name
        } else {
            this._path = target.path + name

            if (this instanceof ProjectDirectory) {
                this._path = this._path + "/"
            }
        }
        return target.addElement(this)
    }

    public toggleRename(): void {
        this._rename = !this._rename
    }

    public get path(): string {
        return this._path
    }

    public get content(): string | CBCFormula | IProjectElement[] {
        return ""
    }

    public set content(content : CBCFormula | string) {
        
    }

    public get name() {
        return this._name;
    }

    public get getsRenamed(): boolean {
        return this._rename    
    }

}


/**
 * Represents a directory in the project, which includes more Projectelements as childs 
 */
export class ProjectDirectory extends ProjectElement {

    public constructor(_parentpath : string, name : string, private _elements : ProjectElement[] = []) {
        super(_parentpath + name + "/", name)
    }

    public override delete(): void {
        this._elements.forEach(element => {
            element.delete()
        })
        
        this._elements = []
    }

    public addElement(element : ProjectElement) : boolean  {
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

    public removeElement(elementName : string) {
        this._elements = this._elements.filter(val => val.name != elementName)
    }

    public override get content() : (ProjectElement[]) {
        return this._elements
    }

    public override move(target: ProjectDirectory, name : string = super.name): boolean {
        const result = super.move(target)

        this._elements.forEach((child : ProjectElement) => child.move(this))

        return result
    }
}


export const fakeProjectElementName = "...new"
export const renameProjectElementName = "...rename"

/**
 * This Child of the Projectelement is used to display new file input in the tree at the desired 
 * location of the user
 */
export class FakeProjectElement extends ProjectElement {

    public constructor(_parentpath : string) {
        super(_parentpath, fakeProjectElementName)
    }

}


export class RenameProjectElement extends ProjectElement {

    private element : ProjectElement

    public constructor(_parentpath : string, element : ProjectElement) {
        super(_parentpath, renameProjectElementName)
        this.element = element
    }

    public override get getsRenamed(): boolean {
        return true
    }
}

/**
 * Represents the files edited in the @see FileEditorComponent, which is text based
 * 
 */
export class CodeFile extends ProjectElement {

    public constructor(_parentpath : string, name : string, public type : string = "java", private _content : string = "") {
        super(_parentpath + name + "." + type, name + "." + type)
    }

    public override get content() : string {
        return this._content
    }

    public override set content(content : string) {
        this._content = content
    }
}

/**
 * Represents the files edited in the @see EditorComponent, which is graph based
 */
export class DiagramFile extends ProjectElement {


    public constructor(private _parentpath : string, name : string, public type : string = "diagram", private _content : CBCFormula = new CBCFormula() ) {
        super(_parentpath + name + "." + type, name + "." + type)
    }

    public override get content() : CBCFormula {
        return this._content
    }

    public override set content(content : CBCFormula) {
        this._content = content
    }
}