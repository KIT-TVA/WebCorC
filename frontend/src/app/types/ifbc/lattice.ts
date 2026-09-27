
export interface ILatticeLevel {
  id: number,
  name: string,
  parents(lattice: ILattice): ILatticeLevel[]
}

export interface ILattice {
  levels: ILatticeLevel[]
  minimalLevel: ILatticeLevel
  levelById(id: number): ILatticeLevel
}

export class LatticeLevel implements ILatticeLevel {
  id: number;
  name: string;
  parentIDs: number[];
  
  constructor(id: number, name: string, parents: number[]) {
    this.id = id;
    this.name = name;
    console.log("lattice level", parents)
    this.parentIDs = parents ?? []
  }

  parents(lattice: ILattice) {
    return this.parentIDs.map(id => lattice.levelById(id))
  }
}

export class ConfidentialityLattice implements ILattice {
  levels: ILatticeLevel[]
  minimalLevel: ILatticeLevel
  _levelsById: { [id: number]: ILatticeLevel }

  constructor(levels: ILatticeLevel[], minLevel?: ILatticeLevel) {
    this.levels = levels;
    this.minimalLevel = minLevel ?? levels[0]
    this._levelsById = Object.fromEntries(levels.map(level => [level.id, level]))
  }

  levelById(id: number): ILatticeLevel {
    return this._levelsById[id]
  }
}

export class IntegrityLattice implements ILattice {
  levels: ILatticeLevel[]
  minimalLevel: ILatticeLevel
  _levelsById: { [id: number]: ILatticeLevel }

  constructor(levels: ILatticeLevel[], minLevel?: ILatticeLevel) {
    this.levels = levels;
    this.minimalLevel = minLevel ?? levels[0]
    this._levelsById = Object.fromEntries(levels.map(level => [level.id, level]))
  }

  levelById(id: number): ILatticeLevel {
    return this._levelsById[id]
  }
}

export const defaultConfidentialityLattice = new ConfidentialityLattice([
  new LatticeLevel(0, "Public", [1]),
  new LatticeLevel(1, "Private", [2]),
  new LatticeLevel(2, "Secret", []),
])

export const defaultIntegrityLattice = new IntegrityLattice([
  new LatticeLevel(0, "Trusted", [1]),
  new LatticeLevel(1, "Untrusted", []),
])