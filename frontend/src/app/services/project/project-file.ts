import { ProjectElement } from "./project-element";

export class ProjectFile extends ProjectElement {

    constructor(_parentpath : string, name : string, public type : string = "diagramm", private _content : string = "") {
        super(_parentpath + name + "." + type, name + "." + type)
    }

    override get content() : string {
        return this._content
    }
}