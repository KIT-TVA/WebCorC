import { CBCFormula } from "../CBCFormula"

/**
 * Enum of inode type
 */
export type InodeType = "directory" | "file"

/**
 * See openapi/schema/file/inode.yml
 */
export interface Inode {
    urn : string
    inodeType: InodeType
}

/**
 * See openapi/schema/file/directory.yml
 */
export class ApiDirectory implements Inode {

    public constructor(
        public urn : string,
        public content : Inode[],
        public inodeType : InodeType = "directory"
    ) {}
}

/**
 * Possible types of files in the project directory
 */
export type ApiFileType = "key" | "prove" | "java" | "diagram" | "other"


/**
 * See openapi/schema/file/diagramm.yml
 */
export class ApiFile implements Inode {

    public constructor(
        public urn : string,
        public inodeType : InodeType = "file",
        public type : ApiFileType
    ) {}
}

/**
 * See openapi/schema/file/diagramm.yml 
 */
export class ApiDiagrammFile implements Inode {

    public constructor(
        public urn : string,
        public content : CBCFormula, 
        public inodeType : InodeType = "file",
    ) {}
}

/**
 * See openapi/schema/file/java.yml
 * See openapi/schema/file/key.yml
 */
export class ApiTextFile implements Inode {
    public constructor(
        public urn : string,
        public content : string,
        public inodeType : InodeType = "file",
    ) {}
}

/**
 * SlimFile without content
 */
export class SlimFile implements Inode {
    public constructor(
        public urn : string,
        public content : string = "",
        public inodeType : InodeType = "file"
    ) {}
}