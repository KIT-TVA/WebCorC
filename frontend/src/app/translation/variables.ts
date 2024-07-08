import {TreeService} from "../services/tree/tree.service";

/**
 * A QbCRegister is a (ordered) set of quantum variables.
 */
export class QbCRegister {
  // Allow only lower case characters
  private static SET_REGEX = /([a-z]+),?/gm;

  // The names of the variables in this register
  private _names: string[];

  constructor() {
    this._names = [];
  }

  updateNames(input: string, treeService: TreeService): void {
    const oldNames = this._names;
    this._names = [];
    const matches = input.matchAll(QbCRegister.SET_REGEX);
    for (let match of matches) {
      this._names.push(match["1"]);
      treeService.addVariable(match["1"]);
    }
    treeService.removeVariables(oldNames);
  }

  export(): any {
    return {names: this._names};
  }

  print(): string {
    return this._names.join(",");
  }

  getHilbertSpace(treeService: TreeService): number {
    return 0
  }

  get names(): string[] {
    return this._names;
  }
}

export const EXPLICIT = "EXPLICIT";
export const SYMBOLIC = "SYMBOLIC";
type ExplicitnessDegree = "EXPLICIT" | "SYMBOLIC";
export class QbCVariable {
  private readonly _name: string;
  private _explicitnessDegree: ExplicitnessDegree = EXPLICIT;

  // In case of:
  //  - EXPLICIT: number to express the actual size of the variable
  //  - SYMBOLIC: name of the symbol representing the (unknown) size
  // A size of 1 equals a qubit, 2 equals a variable consisting of two qubits.
  private _size: string = "1";

  // Counts occurrences in refinements.
  // When getting 0, the variable is unused and being deleted.
  private _usageCounter = 1;

  constructor(name: string, explicitnessDegree?: ExplicitnessDegree, size?: string) {
    this._name = name;
    this._explicitnessDegree = explicitnessDegree ?? EXPLICIT;
    this._size = size ?? "1";
  }

  export(): any {
    return {name: this._name, explicitnessDegree: this._explicitnessDegree, size: this._size};
  }

  indicateUsage(): void {
    this._usageCounter++;
  }

  /**
   * Decreases the usage counter and returns, whether this variable is unused and can be deleted.
   */
  removeUsage(): boolean {
    this._usageCounter--;
    return this._usageCounter === 0;
  }

  get name(): string {
    return this._name;
  }

  get size(): string {
    return this._size;
  }

  get explicitnessDegree(): ExplicitnessDegree {
    return this._explicitnessDegree;
  }

  getHilbertSpaceDimension(): number {
    const sizeAsNumber = Number(this._size);
    if (isNaN(sizeAsNumber)) {
      return NaN;
    } else {
      return Math.pow(2, sizeAsNumber);
    }
  }

  set explicitnessDegree(value: ExplicitnessDegree) {
    this._explicitnessDegree = value;
    if (value === EXPLICIT && (!this._size.match(/[0-9]+/))) {
      this._size = "1";
    } else if (value === SYMBOLIC && this._size.match(/[0-9]*/)) {
      this._size = "n";
    }
  }

  set size(value: string) {
    this._size = value;
  }
}
