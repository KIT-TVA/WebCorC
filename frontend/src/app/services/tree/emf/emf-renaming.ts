import { Renaming } from "../Renaming"

export interface EMFRename {
    type : string
    function : string
    newName : string
}

export interface IEMFRenaming {
    type : string 
    rename : EMFRename[]
}

export class EMFRenaming implements IEMFRenaming {

    constructor(public rename : EMFRename[] = [], public type : string = "Renaming",) {}
}