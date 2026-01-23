import { CBCFormula, LocalCBCFormula } from "../../../types/CBCFormula";
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

  /**
   * Convert a LocalDirectory to an ApiDirectory (recursively)
   */
  public static fromLocal(local: LocalDirectory): ApiDirectory {
    const mapInode = (inode: LocalInode): Inode => {
      if (inode instanceof LocalDirectory) return ApiDirectory.fromLocal(inode);
      if (inode instanceof LocalDiagramFile)
        return ApiDiagramFile.fromLocal(inode);
      if (inode instanceof LocalTextFile) return ApiTextFile.fromLocal(inode);
      if (inode instanceof LocalFile) return ApiFile.fromLocal(inode);
      throw Error("Unknown LocalInode type");
    };
    return new ApiDirectory(
      local.urn,
      local.content.map(mapInode),
      local.inodeType,
    );
  }
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

  /**
   * Convert a LocalFile (or subclass) to an ApiFile.
   * Note: LocalDiagramFile should be converted using ApiDiagramFile.fromLocal.
   */
  public static fromLocal(local: LocalFile): ApiFile {
    return new ApiFile(local.urn, local.inodeType, local.type);
  }
}

/**
 * See openapi/schema/file/diagramm.yml
 */
export class ApiDiagramFile extends ApiFile {
  public content: CBCFormula;
  public constructor(
    urn: string,
    content: CBCFormula,
    inodeType: InodeType = "file",
  ) {
    super(urn, "file", "diagram");
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
    console.log("formatted content", this.content);
  }

  /**
   * Convert a LocalDiagramFile to an ApiDiagramFile.
   * We cast the local content to CBCFormula where shapes are compatible; the
   * constructor will perform the final formatting/validation.
   */
  public static override fromLocal(local: LocalDiagramFile): ApiDiagramFile {
    return new ApiDiagramFile(
      local.urn,
      new CBCFormula(
        local.content.name,
        local.content.statement?.statement,
        local.content.statement?.preCondition,
        local.content.statement?.postCondition,
        local.content.javaVariables,
        local.content.globalConditions,
        local.content.renamings,
        local.content.isProven,
      ),
      local.inodeType,
    );
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

  public static fromLocal(local: LocalTextFile): ApiTextFile {
    return new ApiTextFile(local.urn, local.content, local.inodeType);
  }
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

  public static fromLocal(local: LocalFile): SlimFile {
    return new SlimFile(local.urn, "", local.inodeType);
  }
}

export interface LocalInode {
  urn: string;
  inodeType: InodeType;
  readonly local: true;
}

export class LocalDirectory implements LocalInode {
  public readonly local = true;
  public constructor(
    public urn: string,
    public content: LocalInode[],
    public inodeType: InodeType = "directory",
  ) {}

  public static fromApi(api: ApiDirectory): LocalDirectory {
    const mapInode = (inode: Inode): LocalInode => {
      if (inode instanceof ApiDirectory) return LocalDirectory.fromApi(inode);
      if (inode instanceof ApiDiagramFile)
        return LocalDiagramFile.fromApi(inode);
      if (inode instanceof ApiTextFile) return LocalTextFile.fromApi(inode);
      if (inode instanceof ApiFile) return LocalFile.fromApi(inode);
      throw Error("Unknown Api Inode type");
    };
    return new LocalDirectory(
      api.urn,
      api.content.map(mapInode),
      api.inodeType,
    );
  }
}

export class LocalFile implements LocalInode {
  public readonly local = true;
  public constructor(
    public urn: string,
    public inodeType: InodeType = "file",
    public type: ApiFileType,
  ) {}

  public static fromApi(api: ApiFile): LocalFile {
    return new LocalFile(api.urn, api.inodeType, api.type);
  }
}

export class LocalDiagramFile extends LocalFile {
  public content: LocalCBCFormula;
  public constructor(
    urn: string,
    content: LocalCBCFormula,
    inodeType: InodeType = "file",
  ) {
    super(urn, "file", "diagram");
    const formattedContent = new LocalCBCFormula();
    formattedContent.name = content.name;
    if (!content.statement) {
      throw Error("Exported diagram file has no statement.");
    }
    if (!(content.statement.type == "ROOT")) {
      console.warn("Exported diagram file's root statement type is not ROOT.");
      formattedContent.statement = content.statement;
    } else {
      formattedContent.statement = content.statement as RootStatement;
    }
    if ("position" in content.statement)
      formattedContent.position = content.statement.position as IPosition;
    formattedContent.globalConditions = content.globalConditions;
    formattedContent.javaVariables = content.javaVariables;
    formattedContent.renamings = content.renamings;
    formattedContent.isProven = content.isProven;
    this.content = formattedContent;
    console.log("formatted content", this.content);
  }

  public static override fromApi(api: ApiDiagramFile): LocalDiagramFile {
    return new LocalDiagramFile(
      api.urn,
      new LocalCBCFormula(
        api.content.name,
        new RootStatement(
          "ROOT",
          api.content.preCondition,
          api.content.postCondition,
          api.content.statement,
          api.content.position,
        ),
        api.content.javaVariables,
        api.content.globalConditions,
        api.content.renamings,
        api.content.isProven,
      ),
      api.inodeType,
    );
  }
}

export class LocalTextFile implements LocalInode {
  public readonly local = true;
  public constructor(
    public urn: string,
    public content: string,
    public inodeType: InodeType = "file",
  ) {}

  public static fromApi(api: ApiTextFile): LocalTextFile {
    return new LocalTextFile(api.urn, api.content, api.inodeType);
  }
}
