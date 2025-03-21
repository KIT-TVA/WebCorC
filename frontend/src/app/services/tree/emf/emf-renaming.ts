/**
 * EMF json compatible renaming.
 * @see Renaming
 */
export interface EMFRename {
    type : string
    function : string
    newName : string
}

/**
 * EMF json compatible array of EMFRename.
 * @see EMFRename
 */
export interface IEMFRenaming {
    type : string 
    rename : EMFRename[]
}

/**
 * Default implementation of IEMFRenaming.
 * @see IEMFRenaming
 */
export class EMFRenaming implements IEMFRenaming {

    constructor(public rename : EMFRename[] = [], public type : string = "Renaming",) {}
}