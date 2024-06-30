export class Macro {
  private _name: string;
  private _expression: string;

  constructor(name: string, expression: string) {
    this._name = name;
    this._expression = expression;
  }

  get name(): string {
    return this._name;
  }

  get expression(): string {
    return this._expression;
  }

  export(): any {
    return {name: this.name, expression: this.expression};
  }
}
