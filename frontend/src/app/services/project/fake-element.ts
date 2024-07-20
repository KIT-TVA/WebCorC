import { ProjectElement } from "./project-element";


export const fakeProjectElementName = "...new"

export class FakeProjectElement extends ProjectElement {

    constructor(_parentpath : string) {
        super(_parentpath, fakeProjectElementName)
    }

}