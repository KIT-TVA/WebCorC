export type JavaVariableKind = "LOCAL" | "RETURN" | "GLOBAL";

export interface IJavaVariable {
  name: string;
  kind: JavaVariableKind;
}

/**
 * Class for representing java variables
 * and ensuring signatures are unique
 */
export class JavaVariable implements IJavaVariable {
  constructor(
    public name: string,
    public kind: JavaVariableKind,
  ) {}

  equalName(variable: JavaVariable): boolean {
    return this.name == variable.name;
  }

  public toString() {
    return this.name;
  }
}
