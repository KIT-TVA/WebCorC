import { CBCFormula } from "../CBCFormula";

/**
 * Interface to implement for a Element in the Filetree of a project
 */
export interface IProjectElement {
    delete() : void
    move(target : ProjectDirectory, name : string, history : Map<string, string>) : Map<string, string>
    setPath(name : string, parentPath : string) : void
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

    public setPath(name: string, parentPath: string = this.parentPath): void {
        this._path = parentPath + name
        this.name = name
    }

    public delete(): void {  }

    public move(target : ProjectDirectory, name : string = this._name) : Map<string, string> {
        const oldPath = this.path

        if (target.path == '/') {
            this.setPath(name, "")
        } else {
            this.setPath(name, target.path)
        }

        target.addElement(this)

        return new Map().set(this.path, oldPath)
    }

    public toggleRename(): void {
        this._rename = !this._rename
    }

    public get path(): string {
        return this._path
    }

    public get parentPath() : string {
        return this._path.substring(0, this._path.length - this._name.length)
    }

    protected set path(path : string) {
        this._path = path
    }

    public get content(): string | CBCFormula | IProjectElement[] {
        return ""
    }

    public set content(content : CBCFormula | string) {
        
    }

    public get name() {
        return this._name;
    }

    protected set name(name : string) {
        this._name = name
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

    public override setPath(name: string, parentPath: string = this.parentPath): void {
        super.path = parentPath + name + "/"
        this.name = name
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

    public override move(target: ProjectDirectory, name : string = super.name, history = new Map<string, string>()): Map<string, string> {
        super.move(target, name)

        this._elements.forEach((child : ProjectElement) => {
           child.move(this, child.name)
           .forEach((newPath, oldPath) => history.set(newPath, oldPath))
        })

        return history
    }

    public override get parentPath(): string {
        return super.path.substring(0, super.path.length - super.name.length - 1)
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

    private _element : ProjectElement

    public constructor(_parentpath : string, element : ProjectElement) {
        super(_parentpath, renameProjectElementName)
        this._element = element
    }

    public override get getsRenamed(): boolean {
        return true
    }

    public get elementName() {
        if (this._element instanceof ProjectFile) {
            return this._element.name.substring(0, this._element.name.length -  (this._element as ProjectFile).type.length - 1)
        }

        return this._element.name
    }

    public get element() {
        return this._element
    }

    public override get content(): IProjectElement[] {
        if (this.element instanceof ProjectDirectory) return this.element.content

        return []
    }
}

export abstract class ProjectFile extends ProjectElement {

    private _type : string

    protected constructor(_parentpath : string, name : string, type : string) {
        super(_parentpath + name + "." + type, name + "." + type)
        this._type = type
    }

    public override setPath(name: string, parentPath: string = this.parentPath): void {
        if (name.endsWith("." + this._type)) {
            this.path = parentPath + name
            this.name = name
        } else {
            this.path = parentPath + name + "." + this._type
            this.name = name + "." + this._type
        }
        
    }

    public get type() : string {
        return this._type
    }

    public override get parentPath(): string {
        return super.path.substring(0, super.path.lastIndexOf('/') + 1)
    }

    public override get content(): string | CBCFormula {
        return ""
    }
}

/**
 * Represents the files edited in the @see FileEditorComponent, which is text based
 * 
 */
export class CodeFile extends ProjectFile {

    public constructor(_parentpath : string, name : string, type : string = "java" , private _content : string = "") {
        super(_parentpath, name, type)
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
export class DiagramFile extends ProjectFile {

    public constructor(_parentpath : string, name : string, type : string = "diagram", private _content : CBCFormula = new CBCFormula() ) {
        super(_parentpath, name, type)
    }

    public override get content() : CBCFormula {
        return this._content
    }

    public override set content(content : CBCFormula) {
        this._content = content
    }
}