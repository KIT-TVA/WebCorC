import { CBCFormula } from "./CBCFormula";
import { ProjectElement } from "./project-element";

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

export class DiagrammFile extends ProjectElement {


    constructor(private _parentpath : string, name : string, public type : string = "diagramm", private _content : CBCFormula = new CBCFormula() ) {
        super(_parentpath + name + "." + type, name + "." + type)
    }

    override get content() : CBCFormula {
        return this._content
    }

    override set content(content : CBCFormula) {
        this._content = content
    }
}