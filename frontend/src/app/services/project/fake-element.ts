import { Inode } from "../../types/project/inode";
import { ProjectElement } from "./project-element";


export const fakeProjectElementName = "...new"

/**
 * This Child of the Projectelement is used to display new file input in the tree at the desired 
 * location of the user
 */
export class FakeProjectElement extends ProjectElement {
    
    override export(): Inode {
        throw new Error("Method not implemented.");
    }

    constructor(_parentpath : string) {
        super(_parentpath, fakeProjectElementName)
    }

}