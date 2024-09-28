import { ApiDirectory, Inode } from "../../types/project/inode"
import { ProjectElement } from "./project-element"
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

    override export(): Inode {
        const elements : Inode[] = []

        this._elements.forEach(element => {
            elements.push(element.export())
        })

        return new ApiDirectory(this.path, elements)
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
}