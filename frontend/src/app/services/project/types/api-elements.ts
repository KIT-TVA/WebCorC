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
      formattedContent.statement = content.statement;
    } else {
      console.warn(
        "Improper use of ApiDiagramFile, must not have a root statement",
      );
      formattedContent.statement = (
        content.statement as RootStatement
      ).statement;
    }
    formattedContent.preCondition = content.statement.preCondition;
    formattedContent.postCondition = content.statement.postCondition;
    if ("position" in content.statement)
      formattedContent.position =
        content.position ?? (content.statement.position as IPosition);
    formattedContent.globalConditions = content.globalConditions;
    formattedContent.javaVariables = content.javaVariables;
    formattedContent.renamings = content.renamings;
    formattedContent.isProven = content.isProven;
    this.content = formattedContent;
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
        local.content.statement?.position,
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
    public type: ApiFileType = (urn.split(".").pop() as ApiFileType) ?? "other",
  ) {}

  public static fromLocal(local: LocalTextFile): ApiTextFile {
    return new ApiTextFile(
      local.urn,
      local.content,
      local.inodeType,
      local.urn.split(".").pop() as ApiFileType,
    );
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
  present: boolean;
}

export class LocalDirectory implements LocalInode {
  public readonly local = true;
  public constructor(
    public urn: string,
    public content: LocalInode[],
    public inodeType: InodeType = "directory",
    public present: boolean = true,
  ) {}

  public static fromApi(api: ApiDirectory): LocalDirectory {
    const mapInode = (inode: Inode): LocalInode => {
      if (inode.inodeType === "directory")
        return LocalDirectory.fromApi(inode as ApiDirectory);
      if (inode instanceof ApiDiagramFile)
        return LocalDiagramFile.fromApi(inode);
      if (inode instanceof ApiTextFile) return LocalTextFile.fromApi(inode);
      if (inode instanceof ApiFile) return LocalFile.fromApi(inode);
      return LocalFile.fromApi(inode);
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
    public present: boolean = true,
  ) {}

  public static fromApi(api: Inode): LocalFile {
    if ("type" in api) {
      switch ((api as ApiFile).type) {
        case "diagram":
          return LocalDiagramFile.fromApi(api as ApiDiagramFile);
        case "java":
        case "key":
        case "prove":
          return LocalTextFile.fromApi(api as ApiTextFile);
      }
    }
    switch (api.urn.split(".").pop()) {
      case "diagram":
        return new LocalDiagramFile(
          api.urn,
          new LocalCBCFormula(),
          api.inodeType,
          false,
        );
      case "java":
      case "key":
      case "proof":
        return new LocalTextFile(api.urn, "", api.inodeType, false);
      default:
    }
    throw Error("Unknown Api File type");
  }
}

export class LocalDiagramFile extends LocalFile {
  public content: LocalCBCFormula;
  public constructor(
    urn: string,
    content: LocalCBCFormula,
    inodeType: InodeType = "file",
    present: boolean = true,
  ) {
    super(urn, "file", "diagram", present);
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
  }

  public static override fromApi(api: ApiDiagramFile): LocalDiagramFile {
    // If the api already provides a RootStatement as content.statement, reuse it
    // to avoid nested ROOT -> ROOT structures. Otherwise, wrap the provided
    // statement in a new RootStatement.
    let rootStmt: RootStatement | undefined;
    if (api.content && api.content.statement?.type === "ROOT") {
      rootStmt = api.content.statement as RootStatement;
    } else {
      rootStmt = new RootStatement(
        "ROOT",
        api.content.preCondition,
        api.content.postCondition,
        api.content.statement,
        {
          xinPx: api.content.statement?.position?.xinPx ?? 0,
          yinPx: (api.content.statement?.position?.yinPx ?? 0) - 100,
        },
      );
      console.log(rootStmt.position);
    }

    return new LocalDiagramFile(
      api.urn,
      new LocalCBCFormula(
        api.content.name,
        rootStmt,
        api.content.javaVariables,
        api.content.globalConditions,
        api.content.renamings,
        api.content.isProven,
      ),
      api.inodeType,
    );
  }
}

export class LocalTextFile extends LocalFile {
  public constructor(
    urn: string,
    public content: string,
    inodeType: InodeType = "file",
    present: boolean = true,
  ) {
    super(urn, inodeType, "other", present);
  }

  public static override fromApi(api: ApiFile | ApiTextFile): LocalTextFile {
    if (api instanceof ApiTextFile) {
      return new LocalTextFile(
        api.urn,
        (api as ApiTextFile).content,
        api.inodeType,
      );
    }
    return new LocalTextFile(api.urn, "", api.inodeType);
  }
}

export function fixUrns(inode: LocalInode, prefix: string = "") {
  inode.urn =
    prefix.endsWith("/") || prefix === ""
      ? prefix + inode.urn
      : prefix + "/" + inode.urn;
  if (inode.inodeType === "directory") {
    (inode as LocalDirectory).content.forEach((child) =>
      fixUrns(child, inode.urn),
    );
  }
  return inode;
}
