import {FormalSpecificationValues} from "./form-spec-values/formal-specification-values";

export class FormalParameter {
  private _name: string;
  private _values: FormalSpecificationValues;

  constructor(name: string, values: FormalSpecificationValues) {
    this._name = name;
    this._values = values;
  }

  public display(): string {
    return this.name + " : " + this._values.display();
  }

  get name(): string {
    return this._name;
  }

  get values(): FormalSpecificationValues {
    return this._values;
  }

  export(): any {
    return {name: this._name, values: this._values.values()};
  }
}
