import { ProjectElement } from "./project-element";


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