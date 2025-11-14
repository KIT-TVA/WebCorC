/**
 * Conditon edited in the Condtion Editor
 */
export class Condition implements ICondition {
  condition: string;

  constructor(programStatement: string) {
    this.condition = programStatement;
  }

  export(): ICondition {
    return {
      condition: this.condition,
    };
  }
}

/**
 * Data only conditon class to use in the data only classes.
 * Compatible with the api calls for the backend
 */
export interface ICondition {
  condition: string;
}
