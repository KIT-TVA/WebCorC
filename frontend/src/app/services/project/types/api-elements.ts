import { CBCFormula } from "../../../types/CBCFormula";
import { RootStatement } from "../../../types/statements/root-statement";
import { IPosition } from "../../../types/position";

/**
 * Enum of inode type
 */
export type InodeType = "directory" | "file";

/**
 * See openapi/schema/file/inode.yml
 */
export interface Inode {
  urn: string;
  inodeType: InodeType;
}

/**
 * See openapi/schema/file/directory.yml
 */
export class ApiDirectory implements Inode {
  public constructor(
    public urn: string,
    public content: Inode[],
    public inodeType: InodeType = "directory",
  ) {}
}

/**
 * Possible types of files in the project directory
 */
export type ApiFileType = "key" | "prove" | "java" | "diagram" | "other";

/**
 * See openapi/schema/file/diagramm.yml
 */
export class ApiFile implements Inode {
  public constructor(
    public urn: string,
    public inodeType: InodeType = "file",
    public type: ApiFileType,
  ) {}
}

/**
 * See openapi/schema/file/diagramm.yml
 */
export class ApiDiagrammFile implements Inode {
  public content: CBCFormula;
  public constructor(
    public urn: string,
    content: CBCFormula,
    public inodeType: InodeType = "file",
  ) {
    const formattedContent = new CBCFormula();
    formattedContent.name = content.name;
    if (!content.statement) {
      throw Error("Exported diagram file has no statement.");
    }
    if (!(content.statement.type == "ROOT")) {
      console.warn("Exported diagram file's root statement type is not ROOT.");
      formattedContent.statement = content.statement;
    } else {
      formattedContent.statement = (
        content.statement as RootStatement
      ).statement;
    }
    formattedContent.preCondition = content.statement.preCondition;
    formattedContent.postCondition = content.statement.postCondition;
    if ("position" in content.statement)
      formattedContent.position = content.statement.position as IPosition;
    formattedContent.globalConditions = content.globalConditions;
    formattedContent.javaVariables = content.javaVariables;
    formattedContent.renamings = content.renamings;
    formattedContent.isProven = content.isProven;
    this.content = formattedContent;
  }
}

/**
 * See openapi/schema/file/java.yml
 * See openapi/schema/file/key.yml
 */
export class ApiTextFile implements Inode {
  public constructor(
    public urn: string,
    public content: string,
    public inodeType: InodeType = "file",
  ) {}
}

/**
 * SlimFile without content
 */
export class SlimFile implements Inode {
  public constructor(
    public urn: string,
    public content: string = "",
    public inodeType: InodeType = "file",
  ) {}
}
