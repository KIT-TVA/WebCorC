/**
 * EMF json compatible presentation of a java variable.
 */
export interface EMFVariable {
    name : string,
    kind: string,
    modifier: string,
    displayName: string
}