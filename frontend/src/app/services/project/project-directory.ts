import { ProjectElement } from "./project-element"

export class ProjectDirectory extends ProjectElement {


    constructor(_parentpath : string, name : string, private _elements : ProjectElement[] = []) {
        super(_parentpath + name + "/", name)
    }

    override get content() : (ProjectElement[]) {
        return this._elements
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
}