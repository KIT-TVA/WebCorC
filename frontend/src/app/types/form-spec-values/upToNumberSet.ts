import {FormalSpecificationValues} from "./formal-specification-values";

export class UpToNumberSet extends FormalSpecificationValues {
  private readonly _values: number[] = [];


  constructor(upperBound: number) {
    super();

    for (let i = 0; i <= upperBound; i++) {
      this._values.push(i);
    }
  }

  override display(): string {
    return "[0,...," + this._values[this._values.length - 1] + "]";
  }

  override values(): number[] {
    return this._values;
  }
}
