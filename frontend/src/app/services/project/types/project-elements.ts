import { LocalCBCFormula } from "../../../types/CBCFormula";

export type ProjectElementType =
  | "DIRECTORY"
  | "CODE_FILE"
  | "DIAGRAM_FILE"
  | string;

export interface IProjectElement {
  urn: string;
  renamed: boolean;
  serverSideUrn: string | undefined;
  type: ProjectElementType;
  present: boolean;
}

export abstract class ProjectElement implements IProjectElement {
  public renamed = false;
  public serverSideUrn: string | undefined = undefined;
  protected constructor(
    public urn: string,
    public type: ProjectElementType,
    public present: boolean,
  ) {}

  public get name(): string {
    const parts = this.urn.split("/");
    return parts[parts.length - 1] ?? this.urn;
  }

  public get path(): string {
    return this.urn;
  }

  public get parentPath(): string {
    const parts = this.urn.split("/");
    return parts.slice(0, parts.length - 1).join("/");
  }
}

export class ProjectDirectory extends ProjectElement {
  public contents: ProjectElement[] = [];

  public constructor(
    urn: string,
    contents: ProjectElement[] = [],
    present: boolean,
  ) {
    super(urn, "DIRECTORY", present);
    this.contents = contents;
  }

  // backward-compatible alias
  public get content(): ProjectElement[] {
    return this.contents;
  }

  public set content(c: ProjectElement[]) {
    this.contents = c;
  }

  public addElement(el: ProjectElement): boolean {
    console.log("Add element", this.urn, el);
    if (this.contents.find((e) => e.urn === el.urn)) return false;
    this.contents.push(el);
    console.log("Added");
    return true;
  }

  public removeElement(name: string): boolean {
    const before = this.contents.length;
    this.contents = this.contents.filter((c) => c.name !== name);
    return this.contents.length < before;
  }
}

export class ProjectFile extends ProjectElement {
  public constructor(
    urn: string,
    public fileType: string,
    present: boolean,
  ) {
    super(
      urn,
      (fileType === "diagram"
        ? "DIAGRAM_FILE"
        : "CODE_FILE") as ProjectElementType,
      present,
    );
  }
}

export class CodeFile extends ProjectFile {
  public content: string = "";
  public constructor(urn: string, content: string = "", present: boolean) {
    super(urn, "java", present);
    this.content = content;
  }
}

export class DiagramFile extends ProjectFile {
  public formula: LocalCBCFormula = new LocalCBCFormula();
  public constructor(
    urn: string,
    formula: LocalCBCFormula = new LocalCBCFormula(),
    present: boolean,
  ) {
    super(urn, "diagram", present);
    this.formula = formula;
  }
}
