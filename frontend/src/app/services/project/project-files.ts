import { CBCFormula } from "./CBCFormula";
import { ProjectElement } from "./project-element";

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