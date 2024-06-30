import {FormalSpecificationValues} from "./formal-specification-values";

export class FormalNumberSet extends FormalSpecificationValues {
  public static readonly REPRESENTATION: RegExp = /((?:[0-9]+\.?[0-9]*)+),?/gm;

  private readonly _values: Set<number> = new Set();

  constructor(input: string) {
    super();

    const matches = input.matchAll(FormalNumberSet.REPRESENTATION);
    for (let match of matches) {
      this._values.add(Number(match["1"]));
    }
  }

  override display(): string {
    return "[" + [...this._values].join(", ") + "]";
  }

  override values(): number[] {
    return [...this._values];
  }
}
