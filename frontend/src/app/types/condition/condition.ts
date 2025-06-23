/**
 * Conditon edited in the Condtion Editor
 */
export class Condition implements ICondition {
    programStatement: string;


    constructor(programStatement: string) {
        this.programStatement = programStatement;
    }

    export(): ICondition {
        return {
            programStatement: this.programStatement
        };
    }
}

/**
 * Data only conditon class to use in the data only classes.
 * Compatible with the api calls for the backend
 */
export interface ICondition {
    programStatement: string
}
